import React from 'react';

import { CustomRadioGroup } from '../CustomRadioGroup';

interface IntlLabel {
  id: string;
  defaultMessage: string;
  values?: Record<string, any>;
}

interface BooleanRadioGroupProps {
  intlLabel: IntlLabel;
  name: string;
  onChange: (value: any) => void;
}

export const BooleanRadioGroup = ({
  onChange,
  name,
  intlLabel,
  ...rest
}: BooleanRadioGroupProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.value !== 'false';

    onChange({ target: { name, value: checked, type: 'boolean-radio-group' } });
  };

  return <CustomRadioGroup {...rest} name={name} onChange={handleChange} intlLabel={intlLabel} />;
};
