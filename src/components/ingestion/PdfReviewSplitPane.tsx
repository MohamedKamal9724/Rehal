import React from 'react';
import type { Rate, Supplier } from '../../types';
import { RateIngestionModal } from './RateIngestionModal';
export const PdfReviewSplitPane:React.FC<{isOpen:boolean;onClose:()=>void;suppliers:Supplier[];workspaceId:string;onApproveRates:(rates:Rate[])=>void}>=({onApproveRates,...props})=><RateIngestionModal {...props} onImportRates={onApproveRates}/>;
