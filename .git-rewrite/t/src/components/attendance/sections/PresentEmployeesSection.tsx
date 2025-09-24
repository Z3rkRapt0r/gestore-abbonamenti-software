
import React from 'react';
import { Badge } from '@/components/ui/badge';
import AttendanceDelayBadge from '../AttendanceDelayBadge';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  tracking_start_type?: string;
  attendance: {
    is_manual?: boolean;
    is_business_trip?: boolean;
    is_late?: boolean;
    late_minutes?: number;
    notes?: string;
    check_in_time: string | null;
    check_out_time: string | null;
  };
}

interface PresentEmployeesSectionProps {
  employees: Employee[];
  formatTime: (timeString: string | null) => string;
}

export default function PresentEmployeesSection({ 
  employees, 
  formatTime 
}: PresentEmployeesSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-green-700 text-base mb-3 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        Presenti ({employees.length})
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {employees.length > 0 ? (
          employees.map((employee) => (
            <div key={employee.id} className="p-3 bg-green-50 rounded-lg border border-green-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm">
                      {employee.first_name} {employee.last_name}
                    </span>
                    {employee.attendance.is_manual && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5">
                        Manuale
                      </Badge>
                    )}
                    {employee.attendance.is_business_trip && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs px-1.5 py-0.5">
                        Trasferta
                      </Badge>
                    )}
                    {employee.attendance.check_in_time && (
                      <AttendanceDelayBadge 
                        isLate={employee.attendance.is_late || false}
                        lateMinutes={employee.attendance.late_minutes || 0}
                        className="text-xs px-1.5 py-0.5"
                      />
                    )}
                  </div>
                  {employee.attendance.notes && employee.attendance.notes !== 'Ferie' && (
                    <p className="text-xs text-gray-600">{employee.attendance.notes}</p>
                  )}
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Entrata:</span>
                      <span>{formatTime(employee.attendance.check_in_time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Uscita:</span>
                      <span>{formatTime(employee.attendance.check_out_time)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Nessun dipendente presente fisicamente</p>
        )}
      </div>
    </div>
  );
}
