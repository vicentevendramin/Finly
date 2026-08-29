import React from 'react';
import { useTranslation } from 'react-i18next';
import { textInputClass, labelClass } from '../../styles/formStyles';
import type { ReportDateRange } from '../../types';

interface ReportDateFilterProps {
  value: ReportDateRange;
  onChange: (value: ReportDateRange) => void;
}

const ReportDateFilter: React.FC<ReportDateFilterProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="report-from" className={`${labelClass} mb-1`}>
          {t('reportsPage.from')}
        </label>
        <input
          type="date"
          id="report-from"
          value={value.from ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
          className={`${textInputClass} mt-0 py-2`}
        />
      </div>
      <div>
        <label htmlFor="report-to" className={`${labelClass} mb-1`}>
          {t('reportsPage.to')}
        </label>
        <input
          type="date"
          id="report-to"
          value={value.to ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
          className={`${textInputClass} mt-0 py-2`}
        />
      </div>
    </div>
  );
};

export default ReportDateFilter;
