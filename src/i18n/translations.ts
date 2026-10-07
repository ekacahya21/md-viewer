import type { Language } from '../types';

export interface Translations {
  common: {
    appName: string;
    commands: string;
    search: string;
    saved: string;
    saving: string;
    allSaved: string;
    open: string;
    opened: string;
    close: string;
    cancel: string;
    delete: string;
    copy: string;
    copied: string;
    share: string;
    shared: string;
    current: string;
    words: string;
    minRead: string;
    chars: string;
    characters: string;
  };
  viewMode: {
    reader: string;
    split: string;
    editor: string;
    edit: string;
    view: string;
  };
  header: {
    file: string;
    newDoc: string;
    openFile: string;
    openUrl: string;
    recentDrafts: string;
    export: string;
    html: string;
    htmlSub: string;
    pdf: string;
    pdfSub: string;
    downloadMd: string;
    downloadMdSub: string;
    copyMd: string;
    copyMdSub: string;
    outline: string;
    summary: string;
    theme: string;
    shortcuts: string;
    forkEdit: string;
    downloadDirect: string;
    sharedDoc: string;
  };
  themeNames: {
    paper: string;
    charcoal: string;
    sepia: string;
  };
  statusBar: {
    splitReset: string;
    commands: string;
    shortcuts: string;
  };
  mobile: {
    menuTitle: string;
    studioSubtitle: string;
    sharedSubtitle: string;
    viewsCount: string;
    link: string;
    fork: string;
    navSection: string;
    aiSummaryTitle: string;
    aiSummarySub: string;
    tocTitle: string;
    tocSub: string;
    docSection: string;
    newDoc: string;
    openDevice: string;
    loadUrl: string;
    draftsHistory: string;
    exportSection: string;
    htmlStandalone: string;
    pdfPrint: string;
    downloadFile: string;
    copyText: string;
    themeSection: string;
    languageSection: string;
    helpFaq: string;
  };
  banner: {
    sharedNotice: string;
    updatedNotice: string;
    aiSummaryReady: string;
    aiSummaryReadySub: string;
    viewSummary: string;
    dismiss: string;
  };
  shareModal: {
    title: string;
    desc: string;
    expiration: string;
    never: string;
    days7: string;
    days30: string;
    year1: string;
    createBtn: string;
    updateBtn: string;
    updateSuccess: string;
    copyLink: string;
    scanQr: string;
    viewOnline: string;
    views: string;
    authorNotice: string;
    generating: string;
    updating: string;
  };
  urlModal: {
    title: string;
    inputLabel: string;
    placeholder: string;
    loadBtn: string;
    loading: string;
  };
  draftsDrawer: {
    title: string;
    empty: string;
    deleteTitle: string;
  };
  summaryDrawer: {
    title: string;
    idle: string;
    summarizeNow: string;
    analyzing: string;
    tldrTitle: string;
    takeawaysTitle: string;
    copySummary: string;
    refresh: string;
    tooShort: string;
    disclaimer: string;
  };
  shortcutsModal: {
    title: string;
    faqTab: string;
    shortcutsTab: string;
  };
  editor: {
    placeholder: string;
    bold: string;
    italic: string;
    code: string;
    link: string;
    quote: string;
    math: string;
    mermaid: string;
    table: string;
    task: string;
  };
  dragOverlay: {
    title: string;
    subtitle: string;
    readOnlyTitle: string;
    readOnlySubtitle: string;
  };
  confirmReplaceModal: {
    title: string;
    description: string;
    currentDoc: string;
    newFile: string;
    warning: string;
    cancel: string;
    confirm: string;
  };
  notFound: {
    title: string;
    back: string;
  };
  mermaidModal: {
    title: string;
    zoomIn: string;
    zoomOut: string;
    reset: string;
    copySvg: string;
    downloadSvg: string;
    close: string;
    panHint: string;
    mobileHint: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      appName: 'MD Viewer',
      commands: 'Commands',
      search: 'Search',
      saved: 'Saved',
      saving: 'Saving...',
      allSaved: 'All changes saved',
      open: 'Open',
      opened: 'Open',
      close: 'Close',
      cancel: 'Cancel',
      delete: 'Delete',
      copy: 'Copy',
      copied: 'Copied!',
      share: 'Share',
      shared: 'Shared',
      current: 'Current',
      words: 'words',
      minRead: 'min read',
      chars: 'chars',
      characters: 'characters',
    },
    viewMode: {
      reader: 'Reader',
      split: 'Split',
      editor: 'Editor',
      edit: 'Edit',
      view: 'View',
    },
    header: {
      file: 'File',
      newDoc: 'New Document',
      openFile: 'Open File...',
      openUrl: 'Open from URL...',
      recentDrafts: 'Recent Drafts',
      export: 'Export',
      html: 'Standalone HTML',
      htmlSub: 'Includes inlined math & diagrams',
      pdf: 'Print / Save as PDF',
      pdfSub: 'Clean document print stylesheet',
      downloadMd: 'Download .md',
      downloadMdSub: 'Raw markdown file',
      copyMd: 'Copy Markdown',
      copyMdSub: 'Copy raw source to clipboard',
      outline: 'Outline',
      summary: 'Insights',
      theme: 'Theme',
      shortcuts: 'Shortcuts & FAQ',
      forkEdit: 'Fork & Edit',
      downloadDirect: 'Download (.md)',
      sharedDoc: 'Shared Document',
    },
    themeNames: {
      paper: 'Paper (Light)',
      charcoal: 'Charcoal (Dark)',
      sepia: 'Sepia (Book)',
    },
    statusBar: {
      splitReset: '(reset 50/50)',
      commands: 'Commands',
      shortcuts: 'Shortcuts',
    },
    mobile: {
      menuTitle: 'Menu & Settings',
      studioSubtitle: 'Studio Actions & Preferences',
      sharedSubtitle: 'Shared Document',
      viewsCount: 'views',
      link: 'Link',
      fork: 'Fork',
      navSection: 'Content & Navigation',
      aiSummaryTitle: 'Document Insights',
      aiSummarySub: 'Executive brief & core takeaways',
      tocTitle: 'Table of Contents',
      tocSub: 'Quick section outline & jump',
      docSection: 'Document Management',
      newDoc: 'New Document',
      openDevice: 'Open Local File (.md, .txt)',
      loadUrl: 'Load from Public URL',
      draftsHistory: 'Saved Drafts History',
      exportSection: 'Export & Copy',
      htmlStandalone: 'HTML Standalone',
      pdfPrint: 'PDF / Print',
      downloadFile: 'Download .md',
      copyText: 'Copy MD',
      themeSection: 'Reading Theme',
      languageSection: 'Language',
      helpFaq: 'Help & FAQ',
    },
    banner: {
      sharedNotice: 'You are viewing a shared document (Read-Only).',
      updatedNotice: 'Updated',
      aiSummaryReady: 'Document insights ready',
      aiSummaryReadySub: 'Review distilled takeaways and executive brief',
      viewSummary: 'View',
      dismiss: 'Dismiss',
    },
    shareModal: {
      title: 'Share Document',
      desc: 'Create a public short link or QR code to share this document.',
      expiration: 'Expiration',
      never: 'Never expires',
      days7: '7 Days',
      days30: '30 Days',
      year1: '1 Year',
      createBtn: 'Create Public Link',
      updateBtn: 'Update Shared Link Now',
      updateSuccess: 'Link updated with latest changes!',
      copyLink: 'Copy Link',
      scanQr: 'Scan QR Code',
      viewOnline: 'Open Link',
      views: 'views',
      authorNotice: 'Only you can update this link from this browser.',
      generating: 'Generating link...',
      updating: 'Updating link...',
    },
    urlModal: {
      title: 'Import from URL',
      inputLabel: 'Enter raw Markdown or GitHub file URL:',
      placeholder: 'https://raw.githubusercontent.com/.../README.md',
      loadBtn: 'Load Document',
      loading: 'Fetching document...',
    },
    draftsDrawer: {
      title: 'Recent Drafts & History',
      empty: 'No saved drafts found yet.',
      deleteTitle: 'Delete draft',
    },
    summaryDrawer: {
      title: 'Document Insights',
      idle: 'Distill core ideas and takeaways from this document.',
      summarizeNow: 'Distill Document',
      analyzing: 'Analyzing document structure...',
      tldrTitle: 'Executive Summary',
      takeawaysTitle: 'Key Takeaways',
      copySummary: 'Copy Insights',
      refresh: 'Refresh Insights',
      tooShort: 'Document is too short for insights (minimum 30 characters).',
      disclaimer: 'Distilled from document content. Verify technical facts.',
    },
    shortcutsModal: {
      title: 'MD Viewer Guide & Shortcuts',
      faqTab: 'FAQ & Guide',
      shortcutsTab: 'Keyboard Shortcuts',
    },
    editor: {
      placeholder: 'Start typing your markdown here or drag & drop a .md file...',
      bold: 'Bold (⌘B / Ctrl+B)',
      italic: 'Italic (⌘I / Ctrl+I)',
      code: 'Inline Code (⌘E / Ctrl+E)',
      link: 'Link',
      quote: 'Callout Note',
      math: 'KaTeX Math Block',
      mermaid: 'Mermaid Diagram Template',
      table: 'Table',
      task: 'Task List',
    },
    dragOverlay: {
      title: 'Drop your Markdown file',
      subtitle: 'Accepts .md, .markdown, or .txt files',
      readOnlyTitle: 'File Drop Disabled',
      readOnlySubtitle: 'This document is read-only. Please click "Fork & Edit" first to edit or replace the document.',
    },
    confirmReplaceModal: {
      title: 'Replace Current Document?',
      description: 'Dropping this file will replace the document currently open in your workspace.',
      currentDoc: 'Current document',
      newFile: 'New file',
      warning: 'Make sure you have saved any necessary changes. Your previous document will remain accessible in your drafts history.',
      cancel: 'Cancel',
      confirm: 'Replace Document',
    },
    notFound: {
      title: 'Document Not Found',
      back: 'Back to Main Editor',
    },
    mermaidModal: {
      title: 'Mermaid Diagram Inspector',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      reset: 'Reset',
      copySvg: 'Copy SVG',
      downloadSvg: 'Download',
      close: 'Close',
      panHint: 'Click and drag to pan • Scroll to zoom',
      mobileHint: 'Drag to pan • Pinch to zoom',
    },
  },
  id: {
    common: {
      appName: 'MD Viewer',
      commands: 'Perintah',
      search: 'Cari',
      saved: 'Tersimpan',
      saving: 'Menyimpan...',
      allSaved: 'Perubahan tersimpan',
      open: 'Buka',
      opened: 'Terbuka',
      close: 'Tutup',
      cancel: 'Batal',
      delete: 'Hapus',
      copy: 'Salin',
      copied: 'Tersalin!',
      share: 'Bagikan',
      shared: 'Bersama',
      current: 'Aktif',
      words: 'kata',
      minRead: 'mnt baca',
      chars: 'karakter',
      characters: 'karakter',
    },
    viewMode: {
      reader: 'Reader',
      split: 'Split',
      editor: 'Editor',
      edit: 'Edit',
      view: 'Lihat',
    },
    header: {
      file: 'File',
      newDoc: 'Dokumen Baru',
      openFile: 'Buka File...',
      openUrl: 'Buka dari URL...',
      recentDrafts: 'Riwayat Draft',
      export: 'Export',
      html: 'Standalone HTML',
      htmlSub: 'Termasuk rumus & diagram lengkap',
      pdf: 'Cetak / Simpan PDF',
      pdfSub: 'Format siap cetak rapi',
      downloadMd: 'Download .md',
      downloadMdSub: 'File markdown asli',
      copyMd: 'Salin Markdown',
      copyMdSub: 'Salin teks sumber ke clipboard',
      outline: 'Daftar Isi',
      summary: 'Intisari',
      theme: 'Tema',
      shortcuts: 'Pintasan & FAQ',
      forkEdit: 'Fork Dokumen',
      downloadDirect: 'Download (.md)',
      sharedDoc: 'Dokumen Bersama',
    },
    themeNames: {
      paper: 'Paper (Terang)',
      charcoal: 'Charcoal (Gelap)',
      sepia: 'Sepia (Buku)',
    },
    statusBar: {
      splitReset: '(reset 50/50)',
      commands: 'Perintah',
      shortcuts: 'Pintasan',
    },
    mobile: {
      menuTitle: 'Menu & Pengaturan',
      studioSubtitle: 'Aksi & Preferensi Studio',
      sharedSubtitle: 'Dokumen Bersama',
      viewsCount: 'kali dilihat',
      link: 'Tautan',
      fork: 'Fork',
      navSection: 'Konten & Navigasi',
      aiSummaryTitle: 'Intisari Dokumen',
      aiSummarySub: 'Ringkasan eksekutif & poin penting',
      tocTitle: 'Daftar Isi (Outline)',
      tocSub: 'Navigasi cepat struktur bab dokumen',
      docSection: 'Manajemen Dokumen',
      newDoc: 'Dokumen Baru',
      openDevice: 'Buka File dari Perangkat (.md, .txt)',
      loadUrl: 'Muat dari URL Publik',
      draftsHistory: 'Riwayat Draft Tersimpan',
      exportSection: 'Ekspor & Salin',
      htmlStandalone: 'HTML Standalone',
      pdfPrint: 'PDF / Cetak',
      downloadFile: 'Unduh .md',
      copyText: 'Salin MD',
      themeSection: 'Tema Tampilan',
      languageSection: 'Bahasa',
      helpFaq: 'Panduan & FAQ',
    },
    banner: {
      sharedNotice: 'Anda sedang membuka dokumen bersama (Read-Only).',
      updatedNotice: 'Telah diperbarui',
      aiSummaryReady: 'Intisari dokumen siap dibaca',
      aiSummaryReadySub: 'Tinjau intisari dan ringkasan eksekutif',
      viewSummary: 'Buka Intisari',
      dismiss: 'Tutup',
    },
    shareModal: {
      title: 'Bagikan Dokumen',
      desc: 'Buat tautan pendek publik atau QR code untuk dibagikan ke orang lain.',
      expiration: 'Masa Berlaku',
      never: 'Selamanya',
      days7: '7 Hari',
      days30: '30 Hari',
      year1: '1 Tahun',
      createBtn: 'Buat Tautan Publik',
      updateBtn: 'Perbarui Tautan Sekarang',
      updateSuccess: 'Tautan berhasil diperbarui dengan revisi terbaru!',
      copyLink: 'Salin Tautan',
      scanQr: 'Pindai QR Code',
      viewOnline: 'Buka Tautan',
      views: 'kali dilihat',
      authorNotice: 'Hanya Anda yang dapat memperbarui tautan ini dari browser ini.',
      generating: 'Membuat tautan...',
      updating: 'Memperbarui tautan...',
    },
    urlModal: {
      title: 'Buka dari URL',
      inputLabel: 'Masukkan URL raw Markdown atau tautan GitHub:',
      placeholder: 'https://raw.githubusercontent.com/.../README.md',
      loadBtn: 'Muat Dokumen',
      loading: 'Mengambil dokumen...',
    },
    draftsDrawer: {
      title: 'Riwayat Draft Tersimpan',
      empty: 'Belum ada draf tersimpan.',
      deleteTitle: 'Hapus draf',
    },
    summaryDrawer: {
      title: 'Intisari Dokumen',
      idle: 'Sarikan gagasan inti dan poin utama dari dokumen ini.',
      summarizeNow: 'Sarikan Dokumen',
      analyzing: 'Menganalisis struktur dokumen...',
      tldrTitle: 'Ringkasan Eksekutif',
      takeawaysTitle: 'Poin Kunci & Intisari',
      copySummary: 'Salin Intisari',
      refresh: 'Perbarui Intisari',
      tooShort: 'Dokumen terlalu singkat untuk disarikan (minimal 30 karakter).',
      disclaimer: 'Disarikan secara otomatis dari konten dokumen. Periksa kembali detail teknis.',
    },
    shortcutsModal: {
      title: 'Panduan & Pintasan MD Viewer',
      faqTab: 'Panduan & FAQ',
      shortcutsTab: 'Pintasan Keyboard',
    },
    editor: {
      placeholder: 'Mulai tulis markdown di sini atau tarik file .md ke sini...',
      bold: 'Tebal (⌘B / Ctrl+B)',
      italic: 'Miring (⌘I / Ctrl+I)',
      code: 'Kode (⌘E / Ctrl+E)',
      link: 'Tautan',
      quote: 'Catatan Penting',
      math: 'Rumus Matematika (KaTeX)',
      mermaid: 'Diagram Mermaid',
      table: 'Tabel',
      task: 'Daftar Tugas',
    },
    dragOverlay: {
      title: 'Lepaskan file Markdown di sini',
      subtitle: 'Mendukung file .md, .markdown, atau .txt',
      readOnlyTitle: 'Drop File Dinonaktifkan',
      readOnlySubtitle: 'Dokumen ini berstatus read-only. Silakan klik "Fork & Edit" terlebih dahulu untuk mengedit atau mengganti dokumen.',
    },
    confirmReplaceModal: {
      title: 'Ganti Dokumen Saat Ini?',
      description: 'File yang di-drop akan menggantikan dokumen yang sedang terbuka di workspace Anda.',
      currentDoc: 'Dokumen saat ini',
      newFile: 'File baru',
      warning: 'Pastikan perubahan penting Anda sudah aman. Dokumen sebelumnya tetap tersimpan di riwayat draf.',
      cancel: 'Batal',
      confirm: 'Ganti Dokumen',
    },
    notFound: {
      title: 'Dokumen Tidak Ditemukan',
      back: 'Kembali ke Editor Utama',
    },
    mermaidModal: {
      title: 'Inspektor Diagram Mermaid',
      zoomIn: 'Perbesar',
      zoomOut: 'Perkecil',
      reset: 'Reset',
      copySvg: 'Salin SVG',
      downloadSvg: 'Unduh',
      close: 'Tutup',
      panHint: 'Geser untuk memindahkan • Gulir untuk zoom',
      mobileHint: 'Geser untuk memindahkan • Cubit untuk zoom',
    },
  },
};
