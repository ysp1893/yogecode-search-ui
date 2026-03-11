export interface Entity {
  id?: number;
  entityCode: string;
  entityName: string;
  sourceId: number;
  storageType: 'TABLE' | 'COLLECTION' | string;
  objectSchema?: string;
  objectName: string;
  primaryKeyField?: string;
  businessLabel: string;
  rootSearchable?: boolean;
  active?: boolean;
}
