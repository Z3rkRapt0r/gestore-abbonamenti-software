import { useState } from "react";
import { format } from "date-fns";
import { useActiveEmployees } from "@/hooks/useActiveEmployees";
import { useLeaveConflicts } from "@/hooks/useLeaveConflicts";

export function useSickLeaveValidation(selectedUserId: string) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const { employees } = useActiveEmployees();
  
  const { 
    conflictDates, 
    isLoading: isCalculatingConflicts, 
    isDateDisabled,
    validateSickLeaveRange
  } = useLeaveConflicts(selectedUserId, 'sick_leave');

  // Funzione per validare le date rispetto alla data di assunzione
  const validateDatesAgainstHireDate = (startDate?: Date, endDate?: Date, employeeId?: string) => {
    if (!startDate || !employeeId) return true;

    const employee = employees?.find(emp => emp.id === employeeId);
    if (!employee || !employee.hire_date) return true;

    const hireDateObj = new Date(employee.hire_date);
    
    if (startDate < hireDateObj) {
      setValidationError(`⚠️ Impossibile salvare l'evento: la data di inizio (${format(startDate, 'dd/MM/yyyy')}) è antecedente alla data di assunzione del dipendente (${format(hireDateObj, 'dd/MM/yyyy')}).`);
      return false;
    }

    if (endDate && endDate < hireDateObj) {
      setValidationError(`⚠️ Impossibile salvare l'evento: la data di fine (${format(endDate, 'dd/MM/yyyy')}) è antecedente alla data di assunzione del dipendente (${format(hireDateObj, 'dd/MM/yyyy')}).`);
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Validazione anti-conflitto completa
  const validateConflicts = async (startDate?: Date, endDate?: Date, employeeId?: string) => {
    if (!startDate || !employeeId) return true;

    try {
      console.log('🔍 Controllo conflitti per malattia...');
      const validation = await validateSickLeaveRange(
        employeeId, 
        format(startDate, 'yyyy-MM-dd'),
        endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      );
      
      if (!validation.isValid) {
        setValidationError(validation.conflicts.join('; '));
        return false;
      }
      
      setValidationError(null);
      return true;
    } catch (error) {
      console.error('❌ Errore validazione conflitti malattia:', error);
      setValidationError('Errore durante la validazione dei conflitti');
      return false;
    }
  };

  return {
    validationError,
    setValidationError,
    conflictDates,
    isCalculatingConflicts,
    isDateDisabled,
    validateDatesAgainstHireDate,
    validateConflicts
  };
}