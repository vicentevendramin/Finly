import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { ReportDateRange } from '../../types';

interface ReportExportButtonsProps {
  dateRange: ReportDateRange;
}

const ReportExportButtons: React.FC<ReportExportButtonsProps> = ({ dateRange }) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(format);
    try {
      const blob = await apiService.exportReport(format, dateRange.from, dateRange.to);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacoes.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting !== null}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {isExporting === 'csv' ? t('reportsPage.exporting') : t('reportsPage.exportCsv')}
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={isExporting !== null}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {isExporting === 'pdf' ? t('reportsPage.exporting') : t('reportsPage.exportPdf')}
      </button>
    </div>
  );
};

export default ReportExportButtons;
