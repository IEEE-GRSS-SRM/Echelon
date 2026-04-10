import { FieldConfig, FormElementChooserProps, FormUnitInstance, FormUnitRef } from "../types";
import React, { useState } from "react";

import "./styles.css";

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GetField, GetMultiSelect, GetPopover, GetSingleSelect } from "./UIFactory";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"
import { TagInput } from "./cutom-ui-components/TagInput";
import { useRouter } from "next/navigation"

export default function FormElementsChooser({ setFormUnits, setAddingFormElement }: FormElementChooserProps) {
    const router = useRouter();

    const [formUnitTitle, setFormUnitTitle] = useState<string>("Title")

    const [fileFieldChosen, setFileFieldChosen] = useState<boolean>(false);
    const [fileFieldLabelValue, setFileFieldLabelValue] = useState<string>("");
    const [fileFieldDescValue, setFileFieldDescValue] = useState<string>("");
    const [fileFieldFileTypes, setFileFieldFileTypes] = useState<string[]>([]);

    const [textFieldChosen, setTextFieldChosen] = useState<boolean>(false);
    const [textFieldLabelValue, setTextFieldLabelValue] = useState<string>("");

    const [multiSelectFieldChosen, setMultiSelectFieldChosen] = useState<boolean>(false);
    const [multiSelectFieldLabelValue, setMultiSelectFieldLabelValue] = useState<string>("");
    const [multiSelectValue, setMultiSelectValue] = useState<string[]>([])
    const [userMultiSelectValue, setUserMultiSelectValue] = useState<string[]>([])

    const [numberFieldChosen, setNumberFieldChosen] = useState<boolean>(false);
    const [numberFieldLabelValue, setNumberFieldLabelValue] = useState<string>("");
    const [numberFieldStepDraft, setNumberFieldStepDraft] = useState<string>("");
    const [numberFieldStep, setNumberFieldStep] = useState<number>(1);
    const [numberFieldMinDraft, setNumberFieldMinDraft] = useState<string>("");
    const [numberFieldMin, setNumberFieldMin] = useState<number>(0);
    const [numberFieldMaxDraft, setNumberFieldMaxDraft] = useState<string>("");
    const [numberFieldMax, setNumberFieldMax] = useState<number>(100);

    const [dropdownFieldChosen, setDropdownFieldChosen] = useState<boolean>(false);
    const [dropdownFieldLabelValue, setDropdownFieldLabelValue] = useState<string>("");
    const [dropdownFieldValue, setDropdownFieldValue] = useState<string>("");
    const [userDropdownFieldValue, setUserDropdownFieldValue] = useState<string[]>([]);

    return (
        <div className="overlay">
            <Card className="min-w-[50vw] max-h-[80vh] overflow-y-scroll">
                <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                    <CardDescription>Choose form elements to add the form unit.</CardDescription>
                    <CardAction></CardAction>
                </CardHeader>
                <hr />
                <CardContent>
                    <FieldGroup>
                        <GetField
                            labelValue="Title of Form Unit" 
                            element={<Input onChange={(e) => setFormUnitTitle(e.target.value)}/>}
                        />
                        <Field orientation="horizontal">
                            <Checkbox id="choose-file-checkbox" onCheckedChange={() => setFileFieldChosen(!fileFieldChosen)} />
                            <FieldLabel htmlFor="choose-file-checkbox">File</FieldLabel>
                            {fileFieldChosen && 
                                <GetPopover 
                                    elementList={[
                                        <GetField
                                            labelValue="File Upload Title"
                                            element={
                                                <Input 
                                                    placeholder="Type the title of the file upload."
                                                    onChange={(e) => setFileFieldLabelValue(e.target.value)}
                                                    value={fileFieldLabelValue}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="File Upload Description"
                                            element={
                                                <Input 
                                                    placeholder="Type the description of the file upload."
                                                    onChange={(e) => setFileFieldDescValue(e.target.value)}
                                                    value={fileFieldDescValue}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="Accepted File Types"
                                            element={
                                                <GetMultiSelect
                                                    items={["image/*", "application/pdf"]}
                                                    placeholderText="Choose the accepted file types."
                                                    value={fileFieldFileTypes}
                                                    onValueChange={setFileFieldFileTypes}
                                                />
                                            }
                                        />
                                    ]}
                                />
                        }
                        </Field>
                        <Field orientation="horizontal">
                            <Checkbox id="choose-text-checkbox" onCheckedChange={() => setTextFieldChosen(!textFieldChosen)} />
                            <FieldLabel htmlFor="choose-text-checkbox">Text</FieldLabel>
                            {textFieldChosen &&
                                <GetPopover
                                    elementList={[
                                        <GetField
                                            labelValue="Text Input Title"
                                            element={
                                                <Input 
                                                    placeholder={"Type the title of text input."}
                                                    value={textFieldLabelValue}
                                                    onChange={(e) => setTextFieldLabelValue(e.target.value)}
                                                />
                                            }
                                        />
                                    ]}
                                />
                            }
                        </Field>
                        <Field orientation="horizontal">
                            <Checkbox id="choose-multiselect-checkbox" onCheckedChange={() => setMultiSelectFieldChosen(!multiSelectFieldChosen)} />
                            <FieldLabel htmlFor="choose-multiselect-checkbox">Multiselect</FieldLabel>
                            {multiSelectFieldChosen &&
                                <GetPopover
                                    elementList={[
                                        <GetField
                                            labelValue="Multiselect Input Title"
                                            element={
                                                <Input 
                                                    placeholder={"Type the title of multiselect input."}
                                                    value={multiSelectFieldLabelValue}
                                                    onChange={(e) => setMultiSelectFieldLabelValue(e.target.value)}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="Enter selectables."
                                            element={
                                                <TagInput 
                                                    items={userMultiSelectValue}
                                                    setItems={setUserMultiSelectValue}
                                                />
                                            }
                                        />
                                    ]}
                                />
                            }
                        </Field>
                        <Field orientation="horizontal">
                            <Checkbox id="choose-number-checkbox" onCheckedChange={() => setNumberFieldChosen(!numberFieldChosen)} />
                            <FieldLabel htmlFor="choose-number-checkbox">Number</FieldLabel>
                            {numberFieldChosen &&
                                <GetPopover
                                    elementList={[
                                        <GetField
                                            labelValue="Number Input Title"
                                            element={
                                                <Input 
                                                    placeholder={"Type the title of number input."}
                                                    value={numberFieldLabelValue}
                                                    onChange={(e) => setNumberFieldLabelValue(e.target.value)}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="Number Input Step"
                                            element={
                                                <Input 
                                                    placeholder={"Enter the step value of number input."}
                                                    type="number"
                                                    value={numberFieldStepDraft}
                                                    onChange={(e) => {
                                                        setNumberFieldStepDraft(e.target.value);
                                                        let num = Number(e.target.value);

                                                        if (!isFinite(num) || num <= 0) {
                                                            num = 1;
                                                        }
                                                        setNumberFieldStep(num);
                                                    }}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="Number Input Min"
                                            element={
                                                <Input 
                                                    placeholder={"Enter the minimum value of number input."}
                                                    type="number"
                                                    value={numberFieldMinDraft}
                                                    onChange={(e) => {
                                                        setNumberFieldMinDraft(e.target.value);
                                                        let num = Number(e.target.value);

                                                        if (!isFinite(num) || num <= 0) {
                                                            num = 0;
                                                        }
                                                        setNumberFieldMin(num);
                                                    }}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="Number Input Max"
                                            element={
                                                <Input 
                                                    placeholder={"Enter the maximum value of number input."}
                                                    type="number"
                                                    value={numberFieldMaxDraft}
                                                    onChange={(e) => {
                                                        setNumberFieldMaxDraft(e.target.value);
                                                        let num = Number(e.target.value);

                                                        if (!isFinite(num) || num <= 0) {
                                                            num = 100;
                                                        }
                                                        setNumberFieldMax(num);
                                                    }}
                                                />
                                            }
                                        />,
                                    ]}
                                />
                            }
                        </Field>
                        <Field orientation="horizontal">
                            <Checkbox id="choose-dropdown-checkbox" onCheckedChange={() => setDropdownFieldChosen(!dropdownFieldChosen)} />
                            <FieldLabel htmlFor="choose-dropdown-checkbox">Dropdown</FieldLabel>
                            {dropdownFieldChosen &&
                                <GetPopover
                                    elementList={[
                                        <GetField
                                            labelValue="Dropdown Input Title"
                                            element={
                                                <Input 
                                                    placeholder={"Type the title of dropdown input."}
                                                    value={dropdownFieldLabelValue}
                                                    onChange={(e) => setDropdownFieldLabelValue(e.target.value)}
                                                />
                                            }
                                        />,
                                        <GetField
                                            labelValue="Enter selectables."
                                            element={
                                                <TagInput 
                                                    items={userDropdownFieldValue
                                                    }
                                                    setItems={setUserDropdownFieldValue}
                                                />
                                            }
                                        />,
                                    ]}
                                />
                            }
                        </Field>
                    </FieldGroup>
                </CardContent>
                <hr />
                <CardFooter className="displa-flex flex-col align-middle justify-center">
                    <div className="form-unit">
                        <Label className="mb-1.25 font-black">
                        {formUnitTitle === "" ? "Empty Title" : formUnitTitle}</Label>
                        {fileFieldChosen && 
                        <>
                            <hr className="my-1.25"/>
                            <GetField
                                labelValue={fileFieldLabelValue} 
                                labelDescription={fileFieldDescValue}
                                element={<Input type="file" accept={fileFieldFileTypes.join(",")} />}
                            />
                        </>
                        }

                        {textFieldChosen && 
                        <>
                            <hr className="my-1.25"/>
                            <GetField
                                labelValue={textFieldLabelValue}
                                element={<Input placeholder="..."/>}
                            />
                        </>
                        }

                        {multiSelectFieldChosen && 
                        <>
                            <hr className="my-1.25"/>
                            <GetField
                                labelValue={multiSelectFieldLabelValue}
                                element = {<GetMultiSelect
                                    items={userMultiSelectValue}
                                    placeholderText="Select multiple things."
                                    value={multiSelectValue}
                                    onValueChange={setMultiSelectValue}
                                />}
                            />
                        </>
                        }

                        {numberFieldChosen && 
                        <>
                            <hr className="my-1.25"/>
                            <GetField
                                labelValue={numberFieldLabelValue} 
                                element={<Input type="number" min={numberFieldMin} max={numberFieldMax} step={numberFieldStep}/>}
                            />
                        </>
                        }

                        {dropdownFieldChosen &&
                        <>
                            <hr className="my-1.25"/>
                            <GetField
                                labelValue={dropdownFieldLabelValue}
                                element={
                                    <GetSingleSelect
                                        items={userDropdownFieldValue}
                                        placeholderText="Select a single thing."
                                        value={dropdownFieldValue}
                                        onValueChange={(value) => {
                                            if (value != null) {
                                                setDropdownFieldValue(value);
                                            }
                                        }}
                                    />
                                }
                            />
                        </>
                        }
                    </div>
                    <hr className="my-1.25" />
                    <Button variant="outline" onClick={() => {
                        const fields: FieldConfig[] = [];

                        if (fileFieldChosen) {
                            fields.push({
                                type: "file",
                                label: fileFieldLabelValue,
                                description: fileFieldDescValue,
                                acceptedTypes: fileFieldFileTypes
                            });
                        }

                        if (textFieldChosen) {
                            fields.push({
                                type: "text",
                                label: textFieldLabelValue,
                                placeholder: "..."
                            })
                        }

                        if (numberFieldChosen) {
                            fields.push({
                                type: "number",
                                label: numberFieldLabelValue,
                                min: numberFieldMin,
                                max: numberFieldMax,
                                step: numberFieldStep
                            })
                        }

                        if (dropdownFieldChosen) {
                            fields.push({
                                type: "dropdown",
                                label: dropdownFieldLabelValue,
                                options: userDropdownFieldValue
                            })
                        }

                        if (multiSelectFieldChosen) {
                            fields.push({
                                type: "multiselect",
                                label: multiSelectFieldLabelValue,
                                options: userMultiSelectValue
                            })
                        }

                        const newUnit: FormUnitInstance = {
                            id: Date.now(),
                            title: formUnitTitle,
                            fields: fields,
                            ref: React.createRef<FormUnitRef>()
                        };

                        setFormUnits(prev => [...prev, newUnit]);
                        setAddingFormElement(false);
                    }}>
                    Submit</Button>
                </CardFooter>
            </Card>
        </div>
    );
};
