import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/10 mb-4">
            <AlertTriangle className="w-8 h-8 text-accent-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1C0A00] mb-2">Something went wrong</h2>
          <p className="text-brand-700 text-sm mb-6 max-w-sm">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
