import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api/client';

interface Client {
  id: number;
  label: string;
  value: number;
  email: string;
  phone: string;
  company_name: string;
  full_name: string;
  username: string;
}

interface ClientSearchDropdownProps {
  value: string;
  onClientSelect: (client: Client) => void;
  error?: string;
  required?: boolean;
}

const ClientSearchDropdown: React.FC<ClientSearchDropdownProps> = ({
  value,
  onClientSelect,
  error,
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRTL = localStorage.getItem('language') === 'ar';

  // Search function
  const searchClients = useCallback(async (search: string) => {
    if (!search && !isOpen) return;

    setLoading(true);
    try {
      const response = await api.get(`/users/clients_list/?search=${encodeURIComponent(search)}`);
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Debounce helper
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearchClients = useCallback((search: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      searchClients(search);
    }, 300);
  }, [searchClients]);

  // Load initial clients when dropdown opens
  useEffect(() => {
    if (isOpen && clients.length === 0 && !searchTerm) {
      searchClients('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Search as user types
  useEffect(() => {
    if (searchTerm || isOpen) {
      debouncedSearchClients(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);

    // If user clears the input, also clear the selection
    if (!value) {
      setSelectedClient(null);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm(client.label);
    setIsOpen(false);
    onClientSelect(client);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <label className="form-label required-field">
        {isRTL ? 'اختر العميل' : 'Select Client'}
      </label>

      <div className="input-group">
        <span className="input-group-text">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={isRTL
            ? 'ابحث عن العميل بالاسم أو البريد الإلكتروني أو الشركة...'
            : 'Search client by name, email, or company...'}
          required={required}
        />
        {loading && (
          <span className="input-group-text">
            <span className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </span>
          </span>
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="dropdown-menu show w-100" style={{
          maxHeight: '300px',
          overflowY: 'auto',
          position: 'absolute',
          top: '100%',
          zIndex: 1050
        }}>
          {loading && clients.length === 0 ? (
            <div className="dropdown-item disabled text-center">
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              {isRTL ? 'جاري البحث...' : 'Searching...'}
            </div>
          ) : clients.length > 0 ? (
            clients.map((client) => (
              <button
                key={client.id}
                className={`dropdown-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                onClick={() => handleClientSelect(client)}
                type="button"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">{client.full_name}</div>
                    <small className="text-muted">
                      {client.company_name && <span className="me-2">{client.company_name}</span>}
                      <span>{client.email}</span>
                    </small>
                  </div>
                  {client.phone && (
                    <small className="text-muted ms-2">
                      <i className="bi bi-telephone me-1"></i>
                      {client.phone}
                    </small>
                  )}
                </div>
              </button>
            ))
          ) : searchTerm ? (
            <div className="dropdown-item disabled text-center text-muted">
              {isRTL ? 'لم يتم العثور على عملاء' : 'No clients found'}
            </div>
          ) : (
            <div className="dropdown-item disabled text-center text-muted">
              {isRTL ? 'ابدأ بالكتابة للبحث' : 'Start typing to search'}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="invalid-feedback d-block">{error}</div>
      )}

      {selectedClient && (
        <small className="form-text text-muted">
          <i className="bi bi-check-circle-fill text-success me-1"></i>
          {isRTL
            ? `تم اختيار: ${selectedClient.full_name}`
            : `Selected: ${selectedClient.full_name}`}
        </small>
      )}
    </div>
  );
};

export default ClientSearchDropdown;