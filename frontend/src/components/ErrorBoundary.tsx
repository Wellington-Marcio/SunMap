import { Component } from 'react';
import type { ReactNode } from 'react';

type Props = { children?: ReactNode };

type State = {
  hasError: boolean;
  error: Error | null;
  info: any;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, info: null };
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ hasError: true, error, info });
    // You could also log to an external service here
    // console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children as ReactNode;

    return (
      <div style={{padding:20,background:'#fff1f0',color:'#3b0b0b',borderRadius:8,border:'1px solid #f5c6cb',margin:12}}>
        <h3 style={{marginTop:0}}>Erro ao renderizar o Dashboard</h3>
        <div style={{fontSize:'0.95rem',whiteSpace:'pre-wrap'}}>
          {this.state.error?.message}
        </div>
        {this.state.info && (
          <details style={{marginTop:10,whiteSpace:'pre-wrap'}}>
            <summary>Stack / detalhes</summary>
            <pre style={{fontSize:'0.8rem',overflowX:'auto'}}>{JSON.stringify(this.state.info, null, 2)}</pre>
          </details>
        )}
      </div>
    );
  }
}
