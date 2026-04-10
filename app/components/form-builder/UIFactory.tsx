import { GetFieldProps, GetMultiSelectProps, GetSingleSelectProps, GetPopoverProps, FormUnitProps, FormUnitRef } from "../types";
import { useState, Fragment, forwardRef, useImperativeHandle } from "react";

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"

export function GetField({labelValue, labelDescription, element}: GetFieldProps) {
    return (
        <Field>
            <FieldLabel htmlFor={element.props.id}>{labelValue}</FieldLabel>
            {element}
            <FieldDescription>{labelDescription}</FieldDescription>
        </Field>
    )
}

export function GetPopover({elementList}: GetPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="xs">Edit</Button>
            </PopoverTrigger>
            <PopoverContent className="max-h-64 overflow-auto">
                <PopoverHeader>
                    <PopoverTitle>Form Element Parameters</PopoverTitle>
                    <PopoverDescription>Change form element parameters here.</PopoverDescription>
                </PopoverHeader>
                {
                    elementList.map((element, i) => (
                        <Fragment key={i}>
                            <hr className="my-1.25"/>
                            {element}
                        </Fragment>
                    ))
                }
            </PopoverContent>
        </Popover>
    )
}

export function GetMultiSelect({items, placeholderText, value, onValueChange}: GetMultiSelectProps) {
    return (
        <Combobox
            items={items}
            multiple
            value={value}
            onValueChange={onValueChange}
            defaultValue={items.length ? [items[0]] : []}
        >
            <ComboboxChips className="my-1.25">
                <ComboboxValue>
                {value.map((item) => (
                    <ComboboxChip key={item}>{item}</ComboboxChip>
                ))}
                </ComboboxValue>
                <ComboboxChipsInput placeholder={placeholderText} />
            </ComboboxChips>
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                {(item) => (
                    <ComboboxItem key={item} value={item}>
                    {item}
                    </ComboboxItem>
                )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}


export function GetSingleSelect({items, placeholderText, value, onValueChange}: GetSingleSelectProps) {
    return (
        <Combobox
        items={items}
        value={value}
        onValueChange={onValueChange}
        >
        <ComboboxInput placeholder={placeholderText} />
        <ComboboxContent className="my-1.25">
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
            {(item) => (
                <ComboboxItem key={item} value={item}>
                {item}
                </ComboboxItem>
            )}
            </ComboboxList>
        </ComboboxContent>
        </Combobox>
    )
}

export const GetFormUnit = forwardRef<FormUnitRef, FormUnitProps>(
({ title, fields }, ref) => {

    const [singleSelectValue, setSingleSelectValue] = useState<string>("");
    const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);
    const [fileValue, setFileValue] = useState<File | null>(null);
    const [textValue, setTextValue] = useState<string>("");
    const [numberValue, setNumberValue] = useState<number>(0);

    useImperativeHandle(ref, () => ({
        getValues() {
        return {
            textValue,
            numberValue,
            fileValue,
            singleSelectValue,
            multiSelectValue
        }
        }
    }))

    return (
        <div className="form-unit">
        <Label className="mb-1.25 font-black">
            {title || "Empty Title"}
        </Label>

        {fields.map((field, index) => {
            return (
            <div key={index}>
                <hr className="my-1.25" />

                {field.type === "file" && (
                <GetField
                    labelValue={field.label}
                    labelDescription={field.description}
                    element={
                    <Input
                        type="file"
                        accept={field.acceptedTypes.join(",")}
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setFileValue(file)
                        }}
                    />
                    }
                />
                )}

                {field.type === "text" && (
                <GetField
                    labelValue={field.label}
                    element={
                    <Input placeholder={field.placeholder ?? "..."} onChange={(e) => setTextValue(e.target.value)}/>
                    }
                />
                )}

                {field.type === "number" && (
                <GetField
                    labelValue={field.label}
                    element={
                    <Input
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        onChange={(e) => setNumberValue(Number(e.target.value))}
                    />
                    }
                />
                )}

                {field.type === "dropdown" && (
                <GetField
                    labelValue={field.label}
                    element={
                    <GetSingleSelect
                        items={field.options}
                        placeholderText="Select a single thing."
                        value={singleSelectValue}
                        onValueChange={(value) => {
                            if (value != null) {
                                setSingleSelectValue(value);
                            }
                        }}
                    />
                    }
                />
                )}

                {field.type === "multiselect" && (
                <GetField
                    labelValue={field.label}
                    element={
                    <GetMultiSelect
                        items={field.options}
                        placeholderText="Select multiple things."
                        value={multiSelectValue}
                        onValueChange={setMultiSelectValue}
                    />
                    }
                />
                )}
            </div>
            )
        })}
        </div>
    )
})