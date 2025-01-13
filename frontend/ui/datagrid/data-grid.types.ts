import type { ComponentType, SvelteComponent } from "svelte";

export enum EDataGridColumnTypes {
  TEXT = "TEXT",
  INPUT = "INPUT",
  COMPONENT = "COMPONENT",
}

export interface IColumnType<TRowData> {
  key: string;
  title: string;
  type: EDataGridColumnTypes;
  onClick?: undefined | ((rowData: TRowData) => any);
  minWidth?: number; // in pixels
  maxWidth?: number; // in pixels
  class?: (value: any) => string; // provides value, returns the class string
  style?: (value: any) => string; // provides value, returns the style string
  transform?: (value: any) => string; // provides value, returns the transformed string;
  component?: ComponentType<SvelteComponent>;
  /* Its a function which gets the rowData and returns the list of props.
  Example usage: 
    {
    ...
    component: MakeInputUppercase
    componentPropsPopulator: (rowData) => ({
        input: rowData.text,
      }),
    ...
    }
  */
  componentPropsPopulator?: (rowData: TRowData) => Record<string, any>;
}
