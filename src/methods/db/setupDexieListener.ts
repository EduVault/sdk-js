import { EduvaultDB } from './db';
import { DBCoreMutateRequest, DBCoreMutateResponse } from 'dexie';

export type DexieMutationEvent = (
  req: DBCoreMutateRequest,
  res: DBCoreMutateResponse,
  tableName?: string
) => any;

export const setUpDexieListener = (
  db: EduvaultDB,
  onChange: DexieMutationEvent,
  tables: string[] = [],
  listenerName?: string
) => {
  return db.dexie.use({
    stack: 'dbcore',
    name: listenerName ?? 'EduVault-Listener',
    create(downlevelDatabase) {
      return {
        ...downlevelDatabase,
        table(tableName) {
          const downlevelTable = downlevelDatabase.table(tableName);
          return {
            ...downlevelTable,
            mutate: (req) => {
              return downlevelTable.mutate(req).then((res) => {
                if (tables.length === 0) onChange(req, res, tableName);
                else if (tables.includes(tableName))
                  onChange(req, res, tableName);
                return res;
              });
            },
          };
        },
      };
    },
  });
};
