import { Employee, EmployeeFormData } from '../types/Employee';
import { databaseService } from './database';

class EmployeeService {
  private readonly COLLECTION_NAME = 'colaboradores';

  async getAll(): Promise<Employee[]> {
    return databaseService.employees.getAll();
  }

  async getById(id: string): Promise<Employee | null> {
    return databaseService.employees.getById(id);
  }

  async create(data: EmployeeFormData): Promise<Employee> {
    const employee: Employee = {
      id: crypto.randomUUID(),
      nome: data.nome,
      cpf: data.cpf,
      cargo: data.cargo,
      setor: data.setor,
      email: data.email,
      telefone: data.telefone,
      status: data.status,
      itensVinculados: data.itensVinculados || [],
      salario: data.salario === undefined ? 0 : data.salario,
      dataAdmissao: data.dataAdmissao === undefined ? null : data.dataAdmissao,
      dataDesligamento: data.dataDesligamento === undefined ? null : data.dataDesligamento,
      dataCadastro: new Date(),
      dataAtualizacao: new Date()
    };

    await databaseService.employees.create(data);
    return employee;
  }

  async update(id: string, data: Partial<EmployeeFormData>): Promise<Employee> {
    const employee = await this.getById(id);
    if (!employee) {
      throw new Error('Colaborador não encontrado');
    }

    const updatedEmployee: Employee = {
      ...employee,
      ...data,
      dataAtualizacao: new Date()
    };

    await databaseService.employees.update(id, data);
    return updatedEmployee;
  }

  async delete(id: string): Promise<void> {
    await databaseService.employees.delete(id);
  }

  async vincularItem(employeeId: string, itemId: string): Promise<void> {
    const employee = await this.getById(employeeId);
    if (!employee) {
      throw new Error('Colaborador não encontrado');
    }

    const itensVinculados = employee.itensVinculados || [];
    if (!itensVinculados.includes(itemId)) {
      const updatedItens = [...itensVinculados, itemId];
      await this.update(employeeId, { itensVinculados: updatedItens });
    }
  }

  async desvincularItem(employeeId: string, itemId: string): Promise<void> {
    const employee = await this.getById(employeeId);
    if (!employee) {
      throw new Error('Colaborador não encontrado');
    }

    const itensVinculados = employee.itensVinculados || [];
    const updatedItems = itensVinculados.filter(id => id !== itemId);
    await this.update(employeeId, { itensVinculados: updatedItems });
  }
}

export const employeeService = new EmployeeService(); 