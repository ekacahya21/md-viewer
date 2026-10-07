import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Copy, Download, RefreshCw, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MD Viewer uncaught rendering exception:', error, errorInfo);
  }

  private getDraftContent(): string {
    try {
      return localStorage.getItem('md_viewer_draft') || '';
    } catch {
      return '';
    }
  }

  private handleCopyDraft = async () => {
    const draft = this.getDraftContent();
    if (!draft) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(draft);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = draft;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch (e) {
      console.error('Failed to copy draft:', e);
    }
  };

  private handleDownloadDraft = () => {
    const draft = this.getDraftContent();
    if (!draft) return;

    const blob = new Blob([draft], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `md-viewer-recovered-draft-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      const hasDraft = Boolean(this.getDraftContent());

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#faf8f5] text-[#262320] font-sans">
          <div className="max-w-md w-full bg-white border border-[#e5dfd5] rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            {/* Header Icon */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#1a1715]">
                  Document Render Alert
                </h1>
                <p className="text-xs text-[#786f66] mt-0.5">
                  An unexpected error occurred while rendering the document.
                </p>
              </div>
            </div>

            {/* Error Detail */}
            {this.state.error && (
              <div className="p-3 bg-[#f5efe6] rounded-xl border border-[#e5dfd5] text-xs font-mono text-[#544d45] overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            {/* Rescue Actions */}
            {hasDraft && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-amber-900">
                  Rescue Your Unsaved Text:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={this.handleCopyDraft}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100/50 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Raw Draft</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={this.handleDownloadDraft}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100/50 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>
            )}

            {/* Recovery Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#e5dfd5] gap-3">
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="text-xs text-[#786f66] hover:text-[#1a1715] underline underline-offset-4 cursor-pointer"
              >
                Reset to default view
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#262320] hover:bg-[#1a1715] text-[#faf8f5] text-xs font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
