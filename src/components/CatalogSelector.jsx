import { useState, useEffect } from 'react';
import { getAllCatalogs, createCatalog, suggestCatalog } from '../catalogManager';
import './CatalogSelector.css';

function CatalogSelector({ fileName, selectedCatalog, onCatalogChange, onNewCatalog }) {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCatalog, setShowNewCatalog] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState('');
  const [suggestedCatalog, setSuggestedCatalog] = useState(null);

  useEffect(() => {
    loadCatalogs();
    if (fileName) {
      const suggestion = suggestCatalog(fileName);
      setSuggestedCatalog(suggestion);
      if (!selectedCatalog) {
        onCatalogChange(suggestion);
      }
    }
  }, [fileName]);

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      const catalogList = await getAllCatalogs();
      setCatalogs(catalogList);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) {
      alert('Vui lòng nhập tên catalog');
      return;
    }

    try {
      const catalog = await createCatalog(newCatalogName.trim());
      setCatalogs([...catalogs, catalog]);
      setNewCatalogName('');
      setShowNewCatalog(false);
      onCatalogChange(catalog.name);
      if (onNewCatalog) {
        onNewCatalog(catalog.name);
      }
    } catch (error) {
      console.error('Error creating catalog:', error);
      alert('Không thể tạo catalog: ' + error.message);
    }
  };

  return (
    <div className="catalog-selector">
      <label className="catalog-label">
        📂 Catalog:
        {suggestedCatalog && suggestedCatalog !== selectedCatalog && (
          <span className="catalog-suggestion">
            (Đề xuất: <button 
              type="button" 
              className="suggestion-btn"
              onClick={() => onCatalogChange(suggestedCatalog)}
            >
              {suggestedCatalog}
            </button>)
          </span>
        )}
      </label>
      <div className="catalog-input-group">
        <select
          value={selectedCatalog || ''}
          onChange={(e) => onCatalogChange(e.target.value)}
          className="catalog-select"
        >
          <option value="">-- Chọn catalog --</option>
          {catalogs.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowNewCatalog(!showNewCatalog)}
          className="new-catalog-btn"
          title="Tạo catalog mới"
        >
          +
        </button>
      </div>
      {showNewCatalog && (
        <div className="new-catalog-form">
          <input
            type="text"
            value={newCatalogName}
            onChange={(e) => setNewCatalogName(e.target.value)}
            placeholder="Tên catalog mới..."
            className="new-catalog-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateCatalog();
              }
            }}
          />
          <div className="new-catalog-actions">
            <button
              type="button"
              onClick={handleCreateCatalog}
              className="create-catalog-btn"
            >
              Tạo
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewCatalog(false);
                setNewCatalogName('');
              }}
              className="cancel-catalog-btn"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogSelector;
