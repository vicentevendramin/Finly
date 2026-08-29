import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import GoalCard from '../components/GoalCard';
import GoalFormModal from '../components/GoalFormModal';
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from '../hooks/useGoals';
import type { Goal, NewGoalData } from '../types';

const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: goals = [], isLoading, isError } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const openNewModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSave = async (data: NewGoalData) => {
    if (editingGoal) {
      await updateGoal.mutateAsync({ id: editingGoal.id, data });
    } else {
      await createGoal.mutateAsync(data);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('goalsPage.confirmDelete'))) {
      deleteGoal.mutate(id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {t('goalsPage.title')}
        </h3>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('goalsPage.newGoal')}
        </button>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-gray-400">{t('goalsPage.loading')}</p>}
      {isError && <p className="text-danger-500">{t('goalsPage.loadError')}</p>}

      {!isLoading && !isError && goals.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          <p className="text-lg">{t('goalsPage.empty')}</p>
          <p>{t('goalsPage.emptyHint')}</p>
        </div>
      )}

      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEditModal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        goalToEdit={editingGoal}
      />
    </div>
  );
};

export default GoalsPage;
