import { SalaryHistory } from '../types/Employee';
import { databaseService } from './database';

// A classe SalaryHistoryService não é mais necessária, pois as funções estão no databaseService
// export class SalaryHistoryService { ... }

// As funções para salaryHistory são acessadas diretamente do databaseService
export const salaryHistoryService = {
  getAll: () => databaseService.salaryHistory.getAll(),
  getByEmployeeId: (employeeId: string) => databaseService.salaryHistory.getByEmployeeId(employeeId),
  create: (data: Omit<SalaryHistory, 'id'>) => databaseService.salaryHistory.create(data),
  delete: (id: string) => databaseService.salaryHistory.delete(id),
}; 