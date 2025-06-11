import React, { useState, useEffect } from 'react';
import { databaseService, PurchaseOrder, Supplier } from '../../services/database';
import {
  FaShoppingCart,
  FaList, // Ícone para visualização em lista
  FaTrello, // Ícone para visualização em Kanban
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaCheck,
  FaTimes,
  FaThumbsUp,
  FaThumbsDown,
} from 'react-icons/fa';

// Componente de Modal para Motivo
const ReasonModal = ({ isOpen, onClose, onSubmit, orderId }: { isOpen: boolean, onClose: () => void, onSubmit: (orderId: string, reason: string) => void, orderId: string | null }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (orderId) {
      onSubmit(orderId, reason);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FaTimesCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Motivo da Recusa/Cancelamento
                </h3>
                <div className="mt-2">
                  <textarea
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Digite o motivo..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSubmit}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para a visualização em Lista (será criado em seguida)
const PurchaseOrderList = ({ orders, handleApprove, handleReject, handleApproveBudget, handleRealizePurchase }: { orders: PurchaseOrder[], handleApprove: (orderId: string) => void, handleReject: (orderId: string) => void, handleApproveBudget: (orderId: string) => void, handleRealizePurchase: (orderId: string) => void }) => {
  // Lógica para exibir as ordens em formato de tabela/lista
  return (
    <div>
      {/* No title needed here as the main component has one */}
      {/* Renderizar tabela ou lista de ordens */}
       <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Solicitação
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                   <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(order.data_solicitacao).toLocaleDateString()}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.solicitante}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.descricao}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Display supplier name from the related suppliers object */}
                        {order.suppliers ? (order.suppliers.nome_fantasia || order.suppliers.razao_social) : '-'}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {order.valor !== undefined && order.valor !== null ? `R$ ${order.valor.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Dynamically apply status badge styles */}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${{
                          'Aguardando aprovação': 'bg-yellow-100 text-yellow-800',
                          'Ordem Aprovada': 'bg-green-100 text-green-800',
                          'Aguardando Orçamento': 'bg-blue-100 text-blue-800',
                          'Orçamento Aprovado': 'bg-purple-100 text-purple-800',
                          'Compra Realizada': 'bg-indigo-100 text-indigo-800',
                          'Recusada': 'bg-red-100 text-red-800',
                        }[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         {/* Botões de Ação (Aprovar/Rejeitar/Ver Detalhes) */}
                         {/* Show Approve/Reject only for 'Aguardando aprovação' */}
                         {order.status === 'Aguardando aprovação' && (
                            <div className="flex justify-end space-x-3">
                               {/* Botão Aprovar (List View) */}
                              <button 
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                                onClick={() => handleApprove(order.id)}
                              >
                                Aprovar
                              </button>
                               {/* Botão Rejeitar (List View) */}
                              <button 
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                                onClick={() => handleReject(order.id)}
                              >
                                Rejeitar
                              </button>
                            </div>
                         )}
                          {/* Botões para Aguardando Orçamento na Lista */}
                          {order.status === 'Aguardando Orçamento' && (
                             <div className="flex justify-end space-x-3">
                                <button className="text-green-600 hover:text-green-900 text-sm font-medium"
                                   onClick={() => handleApproveBudget(order.id)}
                                >
                                   Aprovar Orçamento
                                </button>
                                <button className="text-red-600 hover:text-red-900 text-sm font-medium"
                                   onClick={() => handleReject(order.id)}
                                >
                                   Rejeitar Orçamento
                                </button>
                             </div>
                          )}
                           {/* Botões para Orçamento Aprovado na Lista */}
                           {order.status === 'Orçamento Aprovado' && (
                              <div className="flex justify-end space-x-3">
                                 <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    onClick={() => handleRealizePurchase(order.id)}
                                 >
                                    Compra Realizada
                                 </button>
                                 <button className="text-red-600 hover:text-red-900 text-sm font-medium"
                                    onClick={() => handleReject(order.id)}
                                 >
                                    Cancelar
                                 </button>
                              </div>
                           )}
                            {/* Exibir motivo de recusa/cancelamento na Lista */}
                           {order.status === 'Recusada' && order.motivo_recusa && (
                              <div className="text-sm text-red-700 bg-red-50 p-2 rounded-md">
                                 <strong>Motivo:</strong> {order.motivo_recusa}
                              </div>
                           )}
                      </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
};

// Componente para a visualização em Kanban (será criado em seguida)
const PurchaseOrderKanban = ({ orders, handleApprove, handleReject, handleApproveBudget, handleRealizePurchase }: { orders: PurchaseOrder[], handleApprove: (orderId: string) => void, handleReject: (orderId: string) => void, handleApproveBudget: (orderId: string) => void, handleRealizePurchase: (orderId: string) => void }) => {
  console.log('PurchaseOrderKanban recebendo orders:', orders); // Log para verificar os dados recebidos
  
  // Filter orders by the new status values
  const awaitingApprovalOrders = orders.filter(order => order.status === 'Aguardando aprovação');
  const awaitingBudgetOrders = orders.filter(order => order.status === 'Aguardando Orçamento');
  const budgetApprovedOrders = orders.filter(order => order.status === 'Orçamento Aprovado');
  const purchaseRealizedOrders = orders.filter(order => order.status === 'Compra Realizada');
  const rejectedOrders = orders.filter(order => order.status === 'Recusada');

  console.log('Ordens filtradas - Aguardando aprovação:', awaitingApprovalOrders.length);
  console.log('Ordens filtradas - Aguardando Orçamento:', awaitingBudgetOrders.length);
  console.log('Ordens filtradas - Orçamento Aprovado:', budgetApprovedOrders.length);
  console.log('Ordens filtradas - Compra Realizada:', purchaseRealizedOrders.length);
  console.log('Ordens filtradas - Recusada:', rejectedOrders.length);
  console.log('Ordens Recusadas:', rejectedOrders); // Log detalhado das ordens recusadas

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
      {/* Coluna Pendente -> Aguardando aprovação */}
      <div className="bg-gray-100 rounded-lg p-4 border-t-4 border-yellow-500 flex flex-col flex-grow flex-shrink-0">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4 border-b pb-2">Aguardando aprovação ({awaitingApprovalOrders.length})</h3>
        <div className="space-y-4 min-h-[100px] flex flex-col flex-grow">
          {awaitingApprovalOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma ordem aguardando aprovação.</p>
          ) : (
            awaitingApprovalOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
                <div>
                  <p className="text-base font-medium text-gray-900">Solicitante: {order.solicitante}</p>
                  <p className="text-base text-gray-600 mt-2">Data: {new Date(order.data_solicitacao).toLocaleDateString()}</p>
                  <p className="mt-4 text-base text-gray-800">{order.descricao}</p>
                  {order.valor !== undefined && order.valor !== null && (
                    <p className="mt-4 text-base font-semibold text-indigo-600">Valor: R$ {order.valor.toFixed(2)}</p>
                  )}
                  {order.suppliers ? (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: {order.suppliers.nome_fantasia || order.suppliers.razao_social}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: -</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={() => handleApprove(order.id)}
                  >
                    <FaThumbsUp className="h-4 w-4 mr-2" />
                    Aprovar
                  </button>
                  <button 
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={() => handleReject(order.id)}
                  >
                    <FaThumbsDown className="h-4 w-4 mr-2" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coluna Aguardando Orçamento */}
      <div className="bg-gray-100 rounded-lg p-4 border-t-4 border-blue-500 flex flex-col flex-grow flex-shrink-0">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 border-b pb-2">Aguardando Orçamento ({awaitingBudgetOrders.length})</h3>
        <div className="space-y-4 min-h-[100px] flex flex-col flex-grow">
          {awaitingBudgetOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma ordem aguardando orçamento.</p>
          ) : (
            awaitingBudgetOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
                <div>
                  <p className="text-base font-medium text-gray-900">Solicitante: {order.solicitante}</p>
                  <p className="text-base text-gray-600 mt-2">Data: {new Date(order.data_solicitacao).toLocaleDateString()}</p>
                  {order.data_aprovacao && (
                    <p className="text-base text-gray-800 mt-2"><strong>Status alterado em:</strong> {new Date(order.data_aprovacao).toLocaleDateString()}</p>
                  )}
                  <p className="mt-4 text-base text-gray-800">{order.descricao}</p>
                  {order.valor !== undefined && order.valor !== null && (
                    <p className="mt-4 text-base font-semibold text-indigo-600">Valor: R$ {order.valor.toFixed(2)}</p>
                  )}
                  {order.suppliers ? (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: {order.suppliers.nome_fantasia || order.suppliers.razao_social}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: -</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={() => handleApproveBudget(order.id)}
                  >
                    <FaThumbsUp className="h-4 w-4 mr-2" />
                    Aprovar Orçamento
                  </button>
                  <button 
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={() => handleReject(order.id)}
                  >
                    <FaThumbsDown className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coluna Orçamento Aprovado */}
      <div className="bg-gray-100 rounded-lg p-4 border-t-4 border-purple-500 flex flex-col flex-grow flex-shrink-0">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 border-b pb-2">Orçamento Aprovado ({budgetApprovedOrders.length})</h3>
        <div className="space-y-4 min-h-[100px] flex flex-col flex-grow">
          {budgetApprovedOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma ordem com orçamento aprovado.</p>
          ) : (
            budgetApprovedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
                <div>
                  <p className="text-base font-medium text-gray-900">Solicitante: {order.solicitante}</p>
                  <p className="text-base text-gray-600 mt-2">Data: {new Date(order.data_solicitacao).toLocaleDateString()}</p>
                  {order.data_aprovacao && (
                    <p className="text-base text-gray-800 mt-2"><strong>Status alterado em:</strong> {new Date(order.data_aprovacao).toLocaleDateString()}</p>
                  )}
                  <p className="mt-4 text-base text-gray-800">{order.descricao}</p>
                  {order.valor !== undefined && order.valor !== null && (
                    <p className="mt-4 text-base font-semibold text-indigo-600">Valor: R$ {order.valor.toFixed(2)}</p>
                  )}
                  {order.suppliers ? (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: {order.suppliers.nome_fantasia || order.suppliers.razao_social}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: -</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => handleRealizePurchase(order.id)}
                  >
                    <FaThumbsUp className="h-4 w-4 mr-2" />
                    Compra Realizada
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={() => handleReject(order.id)}
                  >
                    <FaThumbsDown className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coluna Compra Realizada */}
      <div className="bg-gray-100 rounded-lg p-4 border-t-4 border-indigo-500 flex flex-col flex-grow flex-shrink-0">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4 border-b pb-2">Compra Realizada ({purchaseRealizedOrders.length})</h3>
        <div className="space-y-4 min-h-[100px] flex flex-col flex-grow">
          {purchaseRealizedOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma ordem com compra realizada.</p>
          ) : (
            purchaseRealizedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
                <div>
                  <p className="text-base font-medium text-gray-900">Solicitante: {order.solicitante}</p>
                  <p className="text-base text-gray-600 mt-2">Data: {new Date(order.data_solicitacao).toLocaleDateString()}</p>
                  {order.data_aprovacao && (
                    <p className="text-base text-gray-800 mt-2"><strong>Status alterado em:</strong> {new Date(order.data_aprovacao).toLocaleDateString()}</p>
                  )}
                  <p className="mt-4 text-base text-gray-800">{order.descricao}</p>
                  {order.valor !== undefined && order.valor !== null && (
                    <p className="mt-4 text-base font-semibold text-indigo-600">Valor: R$ {order.valor.toFixed(2)}</p>
                  )}
                  {order.suppliers ? (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: {order.suppliers.nome_fantasia || order.suppliers.razao_social}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: -</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={() => handleReject(order.id)}
                  >
                    <FaThumbsDown className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coluna Rejeitada -> Recusada */}
      <div className="bg-gray-100 rounded-lg p-4 border-t-4 border-red-500 flex flex-col flex-grow flex-shrink-0">
        <h3 className="text-lg font-semibold text-red-800 mb-4 border-b pb-2">Recusada ({rejectedOrders.length})</h3>
        <div className="space-y-4 min-h-[100px] flex flex-col flex-grow">
          {rejectedOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma ordem rejeitada.</p>
          ) : (
            rejectedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex flex-col justify-between opacity-75 hover:shadow-xl transition-shadow duration-200">
                <div>
                  <p className="text-base font-medium text-gray-900">Solicitante: {order.solicitante}</p>
                  <p className="text-base text-gray-600 mt-2">Data: {new Date(order.data_solicitacao).toLocaleDateString()}</p>
                  {order.data_aprovacao && (
                    <p className="text-base text-gray-800 mt-2"><strong>Status alterado em:</strong> {new Date(order.data_aprovacao).toLocaleDateString()}</p>
                  )}
                  <p className="mt-4 text-base text-gray-800">{order.descricao}</p>
                  {order.valor !== undefined && order.valor !== null && (
                    <p className="mt-4 text-base font-semibold text-indigo-600">Valor: R$ {order.valor.toFixed(2)}</p>
                  )}
                  {order.suppliers ? (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: {order.suppliers.nome_fantasia || order.suppliers.razao_social}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Fornecedor: -</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={() => handleApprove(order.id)}
                  >
                    <FaThumbsUp className="h-4 w-4 mr-2" />
                    Aprovar
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={() => handleReject(order.id)}
                  >
                    <FaThumbsDown className="h-4 w-4 mr-2" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


export function ApprovePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to Kanban
  const [kanbanKey, setKanbanKey] = useState(0); // Novo estado para a chave do Kanban

  // Estado para controlar o modal de motivo
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [orderIdToReject, setOrderIdToReject] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all orders now that we have multiple statuses
      // We will filter them by status in the component for the Kanban view
      const allOrders = await databaseService.purchaseOrders.getAll(); // Assuming getAll exists or fetching by different statuses
      console.log('Ordens carregadas:', allOrders); // Adicionando log para verificar os dados
      setOrders(allOrders); // Ensure state is updated with fresh data
      setKanbanKey(prevKey => prevKey + 1); // Incrementar a chave para forçar a re-renderização do Kanban
    } catch (err: any) {
      console.error('Erro ao carregar ordens:', err);
      setError('Erro ao carregar ordens. Tente novamente.');
      ;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (orderId: string) => {
    console.log('handleApprove chamado para orderId:', orderId); // Log de início
    try {
      console.log('Chamando databaseService.purchaseOrders.approveOrder...'); // Log antes da chamada DB
      await databaseService.purchaseOrders.approveOrder(orderId); // Chamando a função correta do databaseService
      console.log('databaseService.purchaseOrders.approveOrder concluído.'); // Log após a chamada DB
      ;

      // Atualizar o estado localmente para refletir a mudança imediata
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'Aguardando Orçamento' as 'Aguardando Orçamento', data_aprovacao: new Date().toISOString().split('T')[0] } : order
        );
        console.log('Estado local de orders atualizado após aprovação:', updatedOrders); // Log estado local
        return updatedOrders;
      });
      setKanbanKey(prevKey => prevKey + 1); // Forçar re-renderização do Kanban

    } catch (err: any) {
      console.error('Erro ao aprovar ordem:', err);
      setError('Erro ao aprovar ordem de compra.');
    }
  };

  const handleRejectClick = (orderId: string) => {
    setOrderIdToReject(orderId);
    setIsReasonModalOpen(true);
  };

  const handleRejectSubmit = async (orderId: string, reason: string) => {
    console.log('handleRejectSubmit chamado para orderId:', orderId, 'motivo:', reason);
    setIsReasonModalOpen(false);
    try {
      console.log('Chamando databaseService.purchaseOrders.rejectOrder com motivo...');
      // Não esperamos o retorno completo aqui, apenas confirmamos que a chamada foi feita.
      databaseService.purchaseOrders.rejectOrder(orderId, reason);
      console.log('Chamada databaseService.purchaseOrders.rejectOrder iniciada.');
      
      ;
      
      // Atualizar o estado localmente para refletir a mudança imediata
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            console.log('Atualizando ordem:', order.id, 'para status Recusada localmente.');
            return {
              ...order,
              status: 'Recusada' as const,
              motivo_recusa: reason,
              data_aprovacao: new Date().toISOString().split('T')[0]
            };
          }
          return order;
        });
        console.log('Estado local de orders atualizado após cancelamento:', updatedOrders);
        return updatedOrders;
      });
      
      // Forçar re-renderização do Kanban
      setKanbanKey(prevKey => prevKey + 1);
      
    } catch (err: any) {
      console.error('Erro ao cancelar ordem:', err);
      ;
    }
  };

  // Novo handler para Aprovar Orçamento
  const handleApproveBudget = async (orderId: string) => {
    console.log('handleApproveBudget chamado para orderId:', orderId);
    try {
      console.log('Chamando databaseService.purchaseOrders.approveBudget...');
      await databaseService.purchaseOrders.approveBudget(orderId);
      console.log('databaseService.purchaseOrders.approveBudget concluído.');
      ;

      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'Orçamento Aprovado' as 'Orçamento Aprovado' } : order
        );
        console.log('Estado local de orders atualizado após aprovar orçamento:', updatedOrders);
        return updatedOrders;
      });
      setKanbanKey(prevKey => prevKey + 1);

    } catch (err: any) {
      console.error('Erro ao aprovar orçamento:', err);
      setError('Erro ao aprovar orçamento.');
    }
  };

  // Novo handler para Compra Realizada
    const handleRealizePurchase = async (orderId: string) => {
      console.log('handleRealizePurchase chamado para orderId:', orderId);
      try {
        console.log('Chamando databaseService.purchaseOrders.realizePurchase...');
        await databaseService.purchaseOrders.realizePurchase(orderId);
        console.log('databaseService.purchaseOrders.realizePurchase concluído.');
        ;

        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'Compra Realizada' as 'Compra Realizada' } : order
          );
          console.log('Estado local de orders atualizado após compra realizada:', updatedOrders);
          return updatedOrders;
        });
        setKanbanKey(prevKey => prevKey + 1);

      } catch (err: any) {
        console.error('Erro ao realizar compra:', err);
        setError('Erro ao realizar compra.');
      }
    };

  // Filter orders by status for Kanban view - Adjusted for new statuses
  const awaitingApprovalOrders = orders.filter(order => order.status === 'Aguardando aprovação');
  const awaitingBudgetOrders = orders.filter(order => order.status === 'Aguardando Orçamento');
  const budgetApprovedOrders = orders.filter(order => order.status === 'Orçamento Aprovado');
  const purchaseRealizedOrders = orders.filter(order => order.status === 'Compra Realizada');
  const rejectedOrders = orders.filter(order => order.status === 'Recusada');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaShoppingCart className="h-8 w-8 text-indigo-600 mr-3" />
              Aprovar Ordens de Compra
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Visualize e aprove ou rejeite as ordens de compra pendentes.
            </p>
          </div>
           <div className="mt-4 flex md:mt-0 md:ml-4">
             {/* Botões de alternar visualização */}
             <button
               onClick={() => setViewMode('kanban')}
               className={`mr-2 px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                 viewMode === 'kanban'
                   ? 'bg-indigo-600 text-white border-transparent'
                   : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
               }`}
             >
               <FaTrello className="h-4 w-4 mr-2 inline-block" /> Kanban
             </button>
             <button
               onClick={() => setViewMode('list')}
                 className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                 viewMode === 'list'
                   ? 'bg-indigo-600 text-white border-transparent'
                   : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
               }`}
             >
               <FaList className="h-4 w-4 mr-2 inline-block" /> Lista
             </button>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 shadow-sm">
            <div className="flex items-center">
              <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500">Carregando ordens...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500">Nenhuma ordem de compra pendente encontrada.</div>
        ) : viewMode === 'list' ? (
          <PurchaseOrderList orders={orders} handleApprove={handleApprove} handleReject={handleRejectClick} handleApproveBudget={handleApproveBudget} handleRealizePurchase={handleRealizePurchase} />
        ) : (
          <PurchaseOrderKanban key={kanbanKey} orders={orders} handleApprove={handleApprove} handleReject={handleRejectClick} handleApproveBudget={handleApproveBudget} handleRealizePurchase={handleRealizePurchase} />
        )}

      </div>

      {/* Modal de Motivo */}
      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        onSubmit={handleRejectSubmit}
        orderId={orderIdToReject}
      />
    </div>
  );
} 