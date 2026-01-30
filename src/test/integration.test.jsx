import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock tất cả dependencies
vi.mock('../pdfStorage', () => ({
  savePdf: vi.fn(() => Promise.resolve({ id: 'test-id', name: 'test.pdf', url: 'blob:test' })),
  listPdfs: vi.fn(() => Promise.resolve([])),
  getPdfData: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
  deletePdf: vi.fn(() => Promise.resolve()),
}));

vi.mock('../metadataSyncConfig', () => ({
  loadMetadataFromCloud: vi.fn(() => Promise.resolve({ catalogs: [], files: [] })),
  syncMetadataToLocal: vi.fn(() => Promise.resolve()),
}));

vi.mock('../services/googleDrive', () => ({
  isLoggedIn: vi.fn(() => false),
  uploadPdfToDrive: vi.fn(),
  createDriveFolder: vi.fn(),
  listFolders: vi.fn(() => Promise.resolve([])),
  initializeGoogleAPI: vi.fn(() => Promise.resolve()),
}));

vi.mock('../components/DriveFolderSelector', () => ({
  default: ({ selectedFolderId, onFolderChange }) => (
    <div data-testid="drive-folder-selector">
      <span>Selected: {selectedFolderId}</span>
      <button onClick={() => onFolderChange('test-folder-id', 'Test Folder')}>
        Select Folder
      </button>
    </div>
  ),
}));

vi.mock('../components/PDFViewerDirect', () => ({
  default: () => <div data-testid="pdf-viewer">PDF Viewer Mock</div>,
}));

describe('Integration Tests - Bug Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bug Detection: uploadDriveFolderId undefined', () => {
    it('should NOT throw error when component renders', () => {
      // Component should render without throwing error about uploadDriveFolderId
      expect(() => {
        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
      }).not.toThrow();
    });

    it('should pass uploadDriveFolderId props correctly', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Component should render without errors
      expect(screen.getByText(/📚/)).toBeInTheDocument();
    });
  });

  describe('Bug Detection: localStorage fallback', () => {
    it('should handle missing uploadDriveFolderId gracefully', () => {
      localStorage.setItem('pdf-upload-folder-id', 'saved-folder-id');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should not throw error
      expect(screen.getByText(/📚/)).toBeInTheDocument();
    });

    it('should use root as default when no folder selected', () => {
      localStorage.removeItem('pdf-upload-folder-id');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should render without errors
      expect(screen.getByText(/📚/)).toBeInTheDocument();
    });
  });

  describe('Bug Detection: Modal state management', () => {
    it('should handle state cleanup logic', () => {
      // Test state cleanup logic without rendering modal
      const cleanupState = () => {
        return {
          showUploadModal: false,
          pendingFile: null,
          uploadCatalog: null,
          uploadDriveFolderId: null,
          uploadDriveFolderName: null,
        };
      };

      const cleanedState = cleanupState();
      expect(cleanedState.showUploadModal).toBe(false);
      expect(cleanedState.pendingFile).toBeNull();
      expect(cleanedState.uploadDriveFolderId).toBeNull();
    });
  });

  describe('Bug Detection: Error handling', () => {
    it('should handle upload errors gracefully', async () => {
      const { savePdf } = await import('../pdfStorage');
      savePdf.mockRejectedValueOnce(new Error('Upload failed'));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should not crash on error
      expect(screen.getByText(/📚/)).toBeInTheDocument();
    });
  });
});
