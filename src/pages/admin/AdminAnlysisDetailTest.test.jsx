import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminAnalysisDetail from './AdminAnalysisDetail.jsx'
import {
  createResult,
  deleteResult,
  getAnalysisById,
  updateAnalysisState,
  updateResult,
} from '../../services/labResultsApi.js'

// Mock the API module entirely — keeps tests independent of Supabase/network.
vi.mock('../../services/labResultsApi.js', () => ({
  getAnalysisById: vi.fn(),
  createResult: vi.fn(),
  updateResult: vi.fn(),
  deleteResult: vi.fn(),
  deleteAnalysis: vi.fn(),
  updateAnalysisState: vi.fn(),
}))

// Mock the config so parameter suggestion buttons are predictable.
vi.mock('../../config/labOptions.js', () => ({
  ANALYSIS_PARAMETERS: {
    'Hemograma': ['Hemoglobina', 'Leucocitos'],
  },
  BACILOSCOPY_TYPE: 'Baciloscopia',
}))

const baseAnalysis = {
  id: 'analysis-1',
  tipo: 'Hemograma',
  observaciones: null,
  aspecto_macroscopico: null,
  ordenes: {
    pacientes: { nombre: 'Juan Perez', dni: '12345678' },
  },
  resultados: [
    { id: 'result-1', parametro: 'Hemoglobina', valor: '14', referencia: '13-17' },
  ],
}

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/admin/ordenes/order-1/analisis/analysis-1']}>
      <Routes>
        <Route
          path="/admin/ordenes/:id/analisis/:analisis_id"
          element={<AdminAnalysisDetail />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminAnalysisDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('shows a loading state while fetching', () => {
    getAnalysisById.mockReturnValue(new Promise(() => {})) // never resolves
    renderComponent()
    expect(screen.getByText(/cargando analisis/i)).toBeInTheDocument()
  })

  it('shows an error state when the fetch throws', async () => {
    getAnalysisById.mockRejectedValue(new Error('network error'))
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el analisis/i)).toBeInTheDocument()
    })
  })

  it('shows a not-found state when the analysis is null', async () => {
    getAnalysisById.mockResolvedValue(null)
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText(/no se encontro este analisis/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /volver a la orden/i })).toBeInTheDocument()
  })

  it('renders analysis details and existing results once loaded', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hemograma' })).toBeInTheDocument()
    })
    expect(screen.getByText(/juan perez/i)).toBeInTheDocument()
    expect(screen.getByText(/12345678/)).toBeInTheDocument()
    expect(screen.getByText('Hemoglobina')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('fills the form when a suggested parameter button is clicked', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Leucocitos' }))

    expect(screen.getByPlaceholderText('Parametro')).toHaveValue('Leucocitos')
  })

  it('creates a new result on submit when not editing', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    createResult.mockResolvedValue({})
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Parametro'), 'Plaquetas')
    await user.type(screen.getByPlaceholderText('Valor'), '250000')
    await user.click(screen.getByRole('button', { name: /^agregar$/i }))

    await waitFor(() => {
      expect(createResult).toHaveBeenCalledWith('analysis-1', {
        parametro: 'Plaquetas',
        valor: '250000',
        referencia: null,
      })
    })
    // Reloads after submit
    expect(getAnalysisById).toHaveBeenCalledTimes(2)
  })

  it('updates an existing result when editing', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    updateResult.mockResolvedValue({})
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^editar$/i }))

    const valorInput = screen.getByPlaceholderText('Valor')
    await user.clear(valorInput)
    await user.type(valorInput, '15')
    await user.click(screen.getByRole('button', { name: /^actualizar$/i }))

    await waitFor(() => {
      expect(updateResult).toHaveBeenCalledWith('result-1', {
        parametro: 'Hemoglobina',
        valor: '15',
        referencia: '13-17',
      })
    })
  })

  it('cancels editing and resets the form', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^editar$/i }))
    expect(screen.getByPlaceholderText('Parametro')).toHaveValue('Hemoglobina')

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }))
    expect(screen.getByPlaceholderText('Parametro')).toHaveValue('')
    expect(screen.queryByRole('button', { name: /^cancelar$/i })).not.toBeInTheDocument()
  })

  it('marks the analysis as completed', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    updateAnalysisState.mockResolvedValue({})
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /marcar completado/i }))

    await waitFor(() => {
      expect(updateAnalysisState).toHaveBeenCalledWith('analysis-1', 'completado')
    })
    expect(screen.getByText(/analisis marcado como completado/i)).toBeInTheDocument()
  })

  it('deletes a result after confirmation', async () => {
    getAnalysisById.mockResolvedValue(baseAnalysis)
    deleteResult.mockResolvedValue({})
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const row = screen.getByText('Hemoglobina').closest('tr')
    const user = userEvent.setup()
    await user.click(within(row).getByRole('button', { name: /^eliminar$/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteResult).toHaveBeenCalledWith('result-1')
    })
  })

  it('does not delete a result if confirmation is cancelled', async () => {
    window.confirm = vi.fn(() => false)
    getAnalysisById.mockResolvedValue(baseAnalysis)
    renderComponent()
    await waitFor(() => screen.getByText('Hemograma'))

    const row = screen.getByText('Hemoglobina').closest('tr')
    const user = userEvent.setup()
    await user.click(within(row).getByRole('button', { name: /^eliminar$/i }))

    expect(deleteResult).not.toHaveBeenCalled()
  })

  it('shows an empty state message when there are no results', async () => {
    getAnalysisById.mockResolvedValue({ ...baseAnalysis, resultados: [] })
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/no hay resultados registrados/i)).toBeInTheDocument()
    })
  })
})