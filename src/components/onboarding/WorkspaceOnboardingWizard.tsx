import React from 'react';
import { CompanyOnboardingWizard, CompanyOnboardingWizardProps } from './CompanyOnboardingWizard';

/**
 * @deprecated RETIRED: WorkspaceOnboardingWizard has been consolidated into CompanyOnboardingWizard.
 * Use the canonical CompanyOnboardingWizard for all company onboarding.
 */
export const WorkspaceOnboardingWizard: React.FC<any> = (props) => {
  return <CompanyOnboardingWizard {...props} />;
};

export default WorkspaceOnboardingWizard;
