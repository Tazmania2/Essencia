import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';
import { ReportProcessingService } from '../../../services/report-processing.service';

// Mock the ReportProcessingService
jest.mock('../../../services/report-processing.service');

const mockReportProcessingService = ReportProcessingService as jest.Mocked<typeof ReportProcessingService>;

// Helper function to get file input
const getFileInput = () => {
  const container = screen.getByText('Arraste arquivos ou clique para selecionar').closest('div');
  return container?.querySelector('input[type="file"]') as HTMLInputElement;
};

describe('FileUpload', () => {
  const mockOnFileUpload = jest.fn();
  const mockOnFileProcessed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock validateFileFormat to return null (valid) by default
    mockReportProcessingService.validateFileFormat.mockReturnValue(null);
    
    // Mock parseFile to return successful result by default
    mockReportProcessingService.parseFile.mockResolvedValue({
      data: [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          reportDate: '2024-01-01'
        }
      ],
      errors: [],
      isValid: true
    });

    // Mock generateSummary
    mockReportProcessingService.generateSummary.mockReturnValue(
      'Processamento concluído:\n• 1 registros válidos\n\nDistribuição por time:\n• CARTEIRA_I: 1 jogadores'
    );
  });

  it('should render upload area with correct text', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    expect(screen.getByText('Arraste arquivos ou clique para selecionar')).toBeInTheDocument();
    expect(screen.getByText(/Formatos aceitos: .csv, .xlsx, .xls/)).toBeInTheDocument();
  });

  it('should handle file selection via click', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });

  it('should validate files using ReportProcessingService', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    expect(mockReportProcessingService.validateFileFormat).toHaveBeenCalledWith(file);
  });

  it('should show validation errors', async () => {
    mockReportProcessingService.validateFileFormat.mockReturnValue('Arquivo muito grande');
    
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test'], 'large.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('Arquivo muito grande')).toBeInTheDocument();
    });
  });

  it('should process valid files and show results', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} onFileProcessed={mockOnFileProcessed} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(mockReportProcessingService.parseFile).toHaveBeenCalledWith(file);
      expect(mockOnFileProcessed).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('1 registros válidos')).toBeInTheDocument();
    });
  });

  it('should handle parsing errors', async () => {
    mockReportProcessingService.parseFile.mockResolvedValue({
      data: [],
      errors: [
        { row: 1, field: 'playerId', message: 'Campo obrigatório vazio' }
      ],
      isValid: false
    });

    mockReportProcessingService.generateSummary.mockReturnValue(
      'Processamento concluído:\n• 0 registros válidos\n• 1 erros encontrados'
    );

    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('0 registros válidos')).toBeInTheDocument();
    });
  });

  it('should show progress during processing', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    // Should show processing status
    await waitFor(() => {
      expect(screen.getByText('Processando...')).toBeInTheDocument();
    });
  });

  it('should allow removing files', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
    
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(btn => btn.querySelector('svg')); // X button
    if (removeButton) {
      await user.click(removeButton);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
    });
  });

  it('should clear all files', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('Limpar todos');
    await user.click(clearButton);
    
    expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
  });

  it('should handle drag and drop', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const uploadArea = screen.getByText('Arraste arquivos ou clique para selecionar').closest('div');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    // Simulate drag over
    fireEvent.dragOver(uploadArea!, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('Solte os arquivos aqui')).toBeInTheDocument();
    
    // Simulate drop
    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} disabled={true} />);
    
    const uploadArea = screen.getByText('Arraste arquivos ou clique para selecionar').closest('div')?.parentElement;
    expect(uploadArea).toHaveClass('cursor-not-allowed');
  });

  it('should support multiple files when multiple prop is true', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} multiple={true} />);
    
    const file1 = new File(['test1'], 'test1.csv', { type: 'text/csv' });
    const file2 = new File(['test2'], 'test2.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, [file1, file2]);
    
    await waitFor(() => {
      expect(screen.getByText('test1.csv')).toBeInTheDocument();
      expect(screen.getByText('test2.csv')).toBeInTheDocument();
    });
  });

  it('should call onFileUpload with files and parse results', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = getFileInput();
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(
        [file],
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.any(Array),
            errors: expect.any(Array),
            isValid: true
          })
        ])
      );
    });
  });
});