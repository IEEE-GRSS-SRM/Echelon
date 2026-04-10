"use client"

import React from "react";
import { TagInputProps } from "../../types";
import { Input } from "@/components/ui/input"
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
  useComboboxAnchor
} from "@/components/ui/combobox"

export function TagInput({ items = [], setItems }: TagInputProps) {
    const anchor = useComboboxAnchor();

    return (
        <>
            <Input 
                placeholder="Enter selectable."
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const value = e.currentTarget.value.trim();
                        if (!value) {
                            return
                        }
                        
                        if (!items.includes(value)) {
                            setItems(prev => [...prev, value]);
                            e.currentTarget.value = "";
                        }
                    }
                }}
            />

            <Combobox
                multiple
                autoHighlight
                items={items}
                value={items}
                onValueChange={setItems}
                defaultValue={[]}>  

                <ComboboxChips ref={anchor}>
                    <ComboboxValue>
                        {(values) => (
                            <React.Fragment>
                            {values.map((value: string) => (
                                <ComboboxChip key={value}>{value}</ComboboxChip>
                            ))}
                            <ComboboxChipsInput />
                            </React.Fragment>
                        )}
                    </ComboboxValue>
                </ComboboxChips>
            </Combobox>
        </>
    );
}