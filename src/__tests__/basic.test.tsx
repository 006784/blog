import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello World</div>;
    const { getByText } = render(<TestComponent />);
    expect(getByText('Hello World')).toBeInTheDocument();
  });
});