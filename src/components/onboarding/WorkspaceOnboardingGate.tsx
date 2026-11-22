import React from 'react';
import { Workspace, Rate, UILanguage } from '../../types';
import { CompanyOnboardingWizard } from './CompanyOnboardingWizard';
import { repository } from '../../lib/storage';

export interface WorkspaceOnboardingGateProps {
  initialCompanyName?: string;
  initialEmail?: string;
  initialLang?: UILanguage;
  onCancel?: () => void;
  onComplete: (data: {
    workspaceData: Partial<Workspace>;
    activateStarterTariffs: boolean;
    customRates?: Rate[];
    teamMembers?: Array<{ name: string; email: string; role: string; phone?: string }>;
    destinationAction?: 'inquiry' | 'quote' | 'dashboard';
    publicProfileSkipped?: boolean;
  }) => void;
}

/**
 * Dedicated full-page company onboarding gate.
 * Hosts the single canonical 5-step guided journey.
 */
export const WorkspaceOnboardingGate: React.FC<WorkspaceOnboardingGateProps> = ({
  initialCompanyName = '',
  initialEmail = '',
  initialLang = 'ar',
  onCancel,
  onComplete,
}) => {
  const currentWs = repository.getWorkspace();
  const currentUser = repository.getCurrentUser();

  const handleWizardComplete = (data: {
    workspaceData: Partial<Workspace>;
    activateStarterTariffs: boolean;
    teamMembers?: Array<{ name: string; email: string; role: string; phone?: string }>;
    destinationAction?: 'inquiry' | 'quote' | 'dashboard';
    publicProfileSkipped?: boolean;
  }) => {
    // If team members were invited, add them to repository as pending invitations
    if (data.teamMembers && data.teamMembers.length > 0) {
      data.teamMembers.forEach(tm => {
        const roleMap: Record<string, any> = {
          Owner: 'Owner',
          Sales: 'Sales Agent',
          Operations: 'Operations',
          Finance: 'Admin',
          Viewer: 'Viewer',
        };
        const mappedRole = roleMap[tm.role] || (tm.role.includes('Sales') ? 'Sales Agent' : tm.role.includes('Admin') ? 'Admin' : 'Operations');

        repository.saveUser({
          id: `user-tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          workspaceId: currentWs.id,
          name: tm.name,
          email: tm.email,
          role: mappedRole,
          language: 'ar',
          status: 'invited', // Invitation flow - not a fake active employee
          phone: tm.phone,
          customJobTitleEn: tm.role,
          customJobTitleAr: tm.role,
        });
      });
    }

    onComplete(data);
  };

  return (
    <CompanyOnboardingWizard
      initialCompanyName={initialCompanyName || (currentWs.name && currentWs.name !== 'unconfigured' ? currentWs.name : '')}
      initialEmail={initialEmail || currentWs.contactEmail || ''}
      initialLang={initialLang}
      currentUser={currentUser}
      workspace={currentWs}
      onCancel={onCancel}
      onComplete={handleWizardComplete}
    />
  );
};
