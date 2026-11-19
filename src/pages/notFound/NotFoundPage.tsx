/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { SecurityShield3D } from '../../components/visuals/SecurityShield3D';
import { ShieldX, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <ShieldX className="w-12 h-12 text-sky-500" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        404 — Gate Pass Invalid
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        The checkpoint or module you are attempting to access does not exist or has
        been relocated.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Return to Gate Terminal
          </Button>
        </Link>
      </div>
    </div>
  );
};
