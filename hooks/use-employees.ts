import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  FarmEmployeeDTO,
  EmployeeCreateDTO,
  AssignFieldsDTO,
  FieldResponseDTO,
} from '@/services/api-client';
import { FIELD_QUERY_KEYS } from '@/hooks/use-fields';
import { logger } from '@/services/logger';

export const EMPLOYEE_QUERY_KEYS = {
  all: ['farm_employees'] as const,
  assignedToMe: ['fields_assigned_to_me'] as const,
};

export function useEmployeesQuery() {
  return useQuery<FarmEmployeeDTO[], Error>({
    queryKey: EMPLOYEE_QUERY_KEYS.all,
    queryFn: async () => {
      logger.debug('Fetching farm employees list');
      return await api.getEmployees();
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useAssignedToMeFieldsQuery() {
  return useQuery<FieldResponseDTO[], Error>({
    queryKey: EMPLOYEE_QUERY_KEYS.assignedToMe,
    queryFn: async () => {
      logger.debug('Fetching fields assigned to employee');
      return await api.getAssignedToMeFields();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation<FarmEmployeeDTO, Error, EmployeeCreateDTO>({
    mutationFn: async (dto) => {
      logger.info('Adding farm employee:', dto.employee_name, dto.employee_phone);
      return await api.addEmployee(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
    },
  });
}

export function useAssignFieldsMutation() {
  const queryClient = useQueryClient();
  return useMutation<FarmEmployeeDTO, Error, { employeeRecordId: string; data: AssignFieldsDTO }>({
    mutationFn: async ({ employeeRecordId, data }) => {
      logger.info('Assigning fields to employee:', employeeRecordId);
      return await api.assignFieldsToEmployee(employeeRecordId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (employeeRecordId) => {
      logger.info('Deleting farm employee:', employeeRecordId);
      return await api.deleteEmployee(employeeRecordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
    },
  });
}
