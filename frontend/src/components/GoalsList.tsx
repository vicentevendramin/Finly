import React from 'react';
import { useTranslation } from 'react-i18next';

// Dados Falsos para as Metas
const fakeGoals = [
  { id: 1, name: 'Viagem de Férias', current: 1200, total: 3000 },
  { id: 2, name: 'Reserva de Emergência', current: 4500, total: 6000 },
  { id: 3, name: 'Celular Novo', current: 300, total: 1500 },
];

const GoalsList: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.goalsTitle')}</h3>
      
      <ul className="space-y-6">
        {fakeGoals.map(goal => {
          const progress = (goal.current / goal.total) * 100;
          return (
            <li key={goal.id}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">{goal.name}</span>
                <span className="text-sm font-semibold text-blue-600">
                  {progress.toFixed(0)}%
                </span>
              </div>
              {/* Barra de Progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-500 mt-1">
                R$ {goal.current.toFixed(2)} / R$ {goal.total.toFixed(2)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GoalsList;
