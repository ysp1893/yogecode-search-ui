export interface Relation {
  id?: number;
  relationCode: string;
  fromEntityCode: string;
  toEntityCode: string;
  fromField: string;
  toField: string;
  relationType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | string;
  joinStrategy?: 'EXACT' | 'IN' | 'LOOKUP' | string;
  active?: boolean;
}
