import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { TASK_STATUSES, type TaskStatus } from '../models/task.js';
import type { FieldIssue } from '../types/api-error.js';
import {
  DEFAULT_TASK_LIMIT,
  DEFAULT_TASK_PAGE,
  MAX_TASK_LIMIT,
  MAX_TASK_PAGE,
  MAX_TASK_SEARCH_LENGTH,
  TASK_SORT_FIELDS,
  TASK_SORT_ORDERS,
  type TaskListQuery,
  type TaskSortField,
  type TaskSortOrder
} from '../types/task-query.js';

const ALLOWED_QUERY_FIELDS = new Set([
  'page',
  'limit',
  'status',
  'search',
  'sortBy',
  'order',
  'createdFrom',
  'createdTo'
]);

// Fecha (YYYY-MM-DD) o fecha y hora ISO 8601 con zona (Z u offset).
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/;

const readString = (
  query: Record<string, unknown>,
  field: string,
  issues: FieldIssue[]
): string | undefined => {
  const value = query[field];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    issues.push({ field, message: 'Debe enviarse una sola vez como texto.' });
    return undefined;
  }
  return value;
};

const parsePositiveInteger = (
  value: string | undefined,
  field: string,
  defaultValue: number,
  maximum: number,
  issues: FieldIssue[]
): number => {
  if (value === undefined) return defaultValue;
  if (!/^\d+$/.test(value)) {
    issues.push({ field, message: 'Debe ser un número entero positivo.' });
    return defaultValue;
  }
  const parsed = Number(value);
  if (parsed < 1 || parsed > maximum) {
    issues.push({ field, message: `Debe estar entre 1 y ${maximum}.` });
    return defaultValue;
  }
  return parsed;
};

const parseIsoDate = (
  value: string | undefined,
  field: string,
  issues: FieldIssue[]
): Date | undefined => {
  if (value === undefined) return undefined;
  const date = new Date(value);
  if (!ISO_DATE_PATTERN.test(value) || Number.isNaN(date.getTime())) {
    issues.push({ field, message: 'Debe ser una fecha ISO 8601 válida.' });
    return undefined;
  }
  return date;
};

const isTaskStatus = (value: string): value is TaskStatus =>
  TASK_STATUSES.some((status) => status === value);

const isTaskSortField = (value: string): value is TaskSortField =>
  TASK_SORT_FIELDS.some((field) => field === value);

const isTaskSortOrder = (value: string): value is TaskSortOrder =>
  TASK_SORT_ORDERS.some((order) => order === value);

export const validateTaskQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const query: Record<string, unknown> = req.query;
  const issues: FieldIssue[] = [];

  for (const field of Object.keys(query)) {
    if (!ALLOWED_QUERY_FIELDS.has(field)) {
      issues.push({ field, message: 'El parámetro no está permitido.' });
    }
  }

  const rawPage = readString(query, 'page', issues);
  const rawLimit = readString(query, 'limit', issues);
  const rawStatus = readString(query, 'status', issues);
  const rawSearch = readString(query, 'search', issues);
  const rawSortBy = readString(query, 'sortBy', issues);
  const rawOrder = readString(query, 'order', issues);
  const rawCreatedFrom = readString(query, 'createdFrom', issues);
  const rawCreatedTo = readString(query, 'createdTo', issues);

  const page = parsePositiveInteger(
    rawPage,
    'page',
    DEFAULT_TASK_PAGE,
    MAX_TASK_PAGE,
    issues
  );
  const limit = parsePositiveInteger(
    rawLimit,
    'limit',
    DEFAULT_TASK_LIMIT,
    MAX_TASK_LIMIT,
    issues
  );

  let status: TaskStatus | undefined;
  if (rawStatus !== undefined) {
    if (isTaskStatus(rawStatus)) status = rawStatus;
    else issues.push({ field: 'status', message: 'Debe ser pending o completed.' });
  }

  let search: string | undefined;
  if (rawSearch !== undefined) {
    const normalized = rawSearch.trim();
    if (!normalized) {
      issues.push({ field: 'search', message: 'No debe estar vacío.' });
    } else if (normalized.length > MAX_TASK_SEARCH_LENGTH) {
      issues.push({
        field: 'search',
        message: `No debe superar ${MAX_TASK_SEARCH_LENGTH} caracteres.`
      });
    } else {
      search = normalized;
    }
  }

  let sortBy: TaskSortField = 'createdAt';
  if (rawSortBy !== undefined) {
    if (isTaskSortField(rawSortBy)) sortBy = rawSortBy;
    else {
      issues.push({
        field: 'sortBy',
        message: `Debe ser uno de estos campos: ${TASK_SORT_FIELDS.join(', ')}.`
      });
    }
  }

  let order: TaskSortOrder = 'asc';
  if (rawOrder !== undefined) {
    if (isTaskSortOrder(rawOrder)) order = rawOrder;
    else issues.push({ field: 'order', message: 'Debe ser asc o desc.' });
  }

  const createdFrom = parseIsoDate(rawCreatedFrom, 'createdFrom', issues);
  const createdTo = parseIsoDate(rawCreatedTo, 'createdTo', issues);
  if (createdFrom && createdTo && createdFrom.getTime() > createdTo.getTime()) {
    issues.push({
      field: 'createdFrom',
      message: 'No debe ser posterior a createdTo.'
    });
  }

  if (issues.length > 0) {
    next(new AppError(
      'Los parámetros de consulta no son válidos.',
      422,
      'QUERY_VALIDATION_ERROR',
      issues
    ));
    return;
  }

  const taskQuery: TaskListQuery = {
    page,
    limit,
    sortBy,
    order,
    ...(status === undefined ? {} : { status }),
    ...(search === undefined ? {} : { search }),
    ...(createdFrom === undefined ? {} : { createdFrom }),
    ...(createdTo === undefined ? {} : { createdTo })
  };
  res.locals.taskQuery = taskQuery;
  next();
};
