'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SessionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  onClose,
  onExtendSession,
  onLogout,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}> {/* Use onOpenChange to handle closing by clicking outside */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expiration Warning</DialogTitle>
          <DialogDescription>
            Your session will expire in one minute. Please extend your session to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
          <Button onClick={onExtendSession}>Extend Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
