import { ReactElement, Dispatch, SetStateAction, ChangeEventHandler } from "react";

export interface ButtonProps {
    text: string;
};

export interface FormElementChooserProps {
    setFormUnits: React.Dispatch<React.SetStateAction<FormUnitInstance[]>>;
    setAddingFormElement: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface GetPopoverProps {
    elementList: React.ReactElement<GetFieldProps>[];
}

export interface GetFieldProps {
    labelValue: string;
    labelDescription?: string;
    element: ReactElement<HTMLElement>;
}

export interface GetMultiSelectProps {
    items: string[];
    placeholderText: string,
    value: string[];
    onValueChange: (value: string[]) => void;
}

export interface GetSingleSelectProps {
    items: string[];
    placeholderText: string;
    value: string;
    onValueChange: (value: string | null) => void;
}

export interface TagInputProps {
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export type FieldConfig =
  | {
      type: "file"
      label: string
      description?: string
      acceptedTypes: string[]
    }
  | {
      type: "text"
      label: string
      placeholder?: string
    }
  | {
      type: "number"
      label: string
      min?: number
      max?: number
      step?: number
    }
  | {
      type: "dropdown"
      label: string
      options: string[]
    }
  | {
      type: "multiselect"
      label: string
      options: string[]
    }

export type FormUnitProps = {
  title: string
  fields: FieldConfig[]
}

export type FormUnitValues = {
  textValue: string
  numberValue: number
  fileValue: File | null
  singleSelectValue: string
  multiSelectValue: string[]
}

export type FormUnitRef = {
  getValues: () => FormUnitValues
}

export type FormUnitInstance = {
  id: number,
  title: string
  fields: FieldConfig[]
  ref: React.RefObject<FormUnitRef | null>
}