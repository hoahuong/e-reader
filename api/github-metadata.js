/**
 * API route để lưu/đọc metadata từ GitHub repository
 * Sử dụng GitHub API để commit file metadata.json vào repo
 * 
 * Cần set environment variables:
 * - GITHUB_TOKEN: Personal Access Token với repo scope
 * - GITHUB_OWNER: GitHub username hoặc org name
 * - GITHUB_REPO: Repository name
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Tăng timeout lên 60s (max cho Hobby plan)
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE_PATH = 'data/metadata.json';

async function getFileSha() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.sha;
      }
      return null;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[GitHub Metadata] getFileSha timeout sau 20s');
      }
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getFileContent() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Giảm xuống 15s để nhanh hơn
    
    try {
      console.log(`[GitHub Metadata] Đang fetch từ GitHub API: ${GITHUB_OWNER}/${GITHUB_REPO}/${FILE_PATH}`);
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const parsed = JSON.parse(content);
        console.log(`[GitHub Metadata] Đọc thành công: ${parsed.catalogs?.length || 0} catalogs, ${parsed.files?.length || 0} files`);
        return parsed;
      } else if (response.status === 404) {
        console.log('[GitHub Metadata] File không tồn tại (404)');
        return null;
      } else {
        console.warn(`[GitHub Metadata] GitHub API trả về status ${response.status}`);
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[GitHub Metadata] getFileContent timeout sau 15s');
      } else {
        console.error('[GitHub Metadata] Lỗi fetch:', fetchError.message);
      }
      return null;
    }
  } catch (error) {
    console.error('[GitHub Metadata] Lỗi trong getFileContent:', error.message);
    return null;
  }
}

export default async function handler(request) {
  // Kiểm tra config
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return new Response(
      JSON.stringify({ 
        error: 'Thiếu cấu hình GitHub',
        details: 'Cần set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO trong environment variables'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (request.method === 'GET') {
    try {
      console.log('[GitHub Metadata] GET request - Đang lấy file content...');
      const metadata = await getFileContent();
      if (metadata) {
        console.log('[GitHub Metadata] Tìm thấy metadata trên GitHub');
        return new Response(
          JSON.stringify(metadata),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // File chưa tồn tại, trả về empty
        console.log('[GitHub Metadata] File chưa tồn tại, trả về empty metadata');
        return new Response(
          JSON.stringify({
            catalogs: [],
            files: [],
            lastSync: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('[GitHub Metadata] Lỗi khi đọc:', error);
      console.error('[GitHub Metadata] Chi tiết lỗi:', error.message, error.stack);
      // Nếu lỗi là 404, trả về empty metadata thay vì error
      if (error.message && error.message.includes('404')) {
        console.log('[GitHub Metadata] File không tồn tại (404), trả về empty');
        return new Response(
          JSON.stringify({
            catalogs: [],
            files: [],
            lastSync: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ 
          error: 'Không thể đọc metadata từ GitHub',
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const data = await request.json();
      const { catalogs, files, lastSync } = data;

      const metadata = {
        catalogs: catalogs || [],
        files: files || [],
        lastSync: lastSync || Date.now(),
        version: 1,
      };

      const content = JSON.stringify(metadata, null, 2);
      const encodedContent = Buffer.from(content).toString('base64');

      // Lấy SHA của file hiện tại (nếu có) với timeout
      console.log('[GitHub Metadata] Đang lấy SHA của file hiện tại...');
      const sha = await getFileSha();

      // Tạo AbortController với timeout 50s (trước khi function timeout 60s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);
      
      try {
        console.log('[GitHub Metadata] Đang commit file lên GitHub...');
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Update metadata - ${new Date().toISOString()}`,
              content: encodedContent,
              sha: sha, // Nếu có SHA thì update, không có thì tạo mới
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          console.log('[GitHub Metadata] Commit thành công:', result.content.html_url);
          return new Response(
            JSON.stringify({
              success: true,
              url: result.content.html_url,
              lastSync: metadata.lastSync,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `GitHub API error: ${response.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('[GitHub Metadata] Request timeout sau 50s');
          throw new Error('Request timeout - GitHub API không phản hồi kịp thời');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('[GitHub Metadata] Lỗi khi lưu:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Không thể lưu metadata lên GitHub',
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}
