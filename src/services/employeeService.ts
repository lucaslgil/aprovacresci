import { Employee, EmployeeFormData } from '../types/Employee';
import { databaseService } from './database';

class EmployeeService {
  async getAll(): Promise<Employee[]> {
    return databaseService.employees.getAll();
  }

  async getById(id: string): Promise<Employee | null> {
    return databaseService.employees.getById(id);
  }

  async create(data: EmployeeFormData): Promise<Employee> {
    const employee: Employee = {
      id: crypto.randomUUID(),
      nome_completo: data.nome_completo,
      cpf: data.cpf,
      email: data.email,
      data_nascimento: data.data_nascimento,
      data_admissao: data.data_admissao,
      data_desligamento: data.data_desligamento,
      cargo: data.cargo,
      departamento: data.departamento,
      setor: data.setor,
      endereco: data.endereco,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      telefone: data.telefone,
      salario_inicial: data.salario_inicial ?? 0,
      salario_atual: data.salario_atual ?? 0,
      status: data.status,
      itens_vinculados: data.itens_vinculados || [],
      empresa_id: data.empresa_id,
      company_id: data.company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data_cadastro: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
    };

    await databaseService.employees.create(employee);
    return employee;
  }

  async update(id: string, data: Partial<EmployeeFormData>): Promise<Employee> {
    const employee = await this.getById(id);
    if (!employee) {
      throw new Error('Colaborador não encontrado');
    }
    // Garante que salario_inicial e salario_atual nunca sejam null
    const updatedEmployee: Employee = {
      ...employee,
      ...data,
      salario_inicial: data.salario_inicial ?? employee.salario_inicial,
      salario_atual: data.salario_atual ?? employee.salario_atual,
      itens_vinculados: data.itens_vinculados ?? employee.itens_vinculados ?? [],
      updated_at: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
    };
    await databaseService.employees.update(id, {
      ...data,
      salario_inicial: data.salario_inicial ?? employee.salario_inicial,
      salario_atual: data.salario_atual ?? employee.salario_atual,
    });
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

    const itens_vinculados = employee.itens_vinculados || [];
    if (!itens_vinculados.includes(itemId)) {
      itens_vinculados.push(itemId);
      await this.update(employeeId, { itens_vinculados });
    }
  }

  async desvincularItem(employeeId: string, itemId: string): Promise<void> {
    const employee = await this.getById(employeeId);
    if (!employee) {
      throw new Error('Colaborador não encontrado');
    }

    const itens_vinculados = (employee.itens_vinculados || []).filter((id: string) => id !== itemId);
    await this.update(employeeId, { itens_vinculados });
  }
}

export const employeeService = new EmployeeService();