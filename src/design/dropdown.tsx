import type { JSX } from "veles/jsx-runtime";

import "./dropdown.css";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownProps = Omit<JSX.HTMLAttributes<HTMLSelectElement>, "children"> & {
  options: readonly DropdownOption[];
  placeholder: string;
};

export function Dropdown({ options, placeholder, ...props }: DropdownProps) {
  return (
    <span data-toolbox-dropdown="">
      <select {...props} data-toolbox-dropdown-select="">
        {[
          <option value="" disabled selected>
            {placeholder}
          </option>,
          ...options.map((option) => (
            <option value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          )),
        ]}
      </select>
      <span data-toolbox-dropdown-arrow="" aria-hidden="true">
        ▾
      </span>
    </span>
  );
}
