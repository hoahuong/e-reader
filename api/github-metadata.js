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
  maxDuration: 10,
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE_PATH = 'data/metadata.json';

async function getFileSha() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function getFileContent() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
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
      const metadata = await getFileContent();
      if (metadata) {
        return new Response(
          JSON.stringify(metadata),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // File chưa tồn tại, trả về empty
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

      // Lấy SHA của file hiện tại (nếu có)
      const sha = await getFileSha();

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
        }
      );

      if (response.ok) {
        const result = await response.json();
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
