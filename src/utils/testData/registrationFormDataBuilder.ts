import { faker } from '@faker-js/faker';
import type { RegistrationFormData } from '../../pages/RegisterPage';

export function buildFakeRegistrationFormData(
  overrides: Partial<RegistrationFormData> = {},
): Required<RegistrationFormData> {
  const password = faker.internet.password({ length: 12, prefix: 'Qa!' });
  const defaults: Required<RegistrationFormData> = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
    phoneNumber: faker.string.numeric(10),
    ssn: `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`,
    username: `qa_${faker.string.alphanumeric({ length: 8, casing: 'lower' })}_${Date.now().toString(36)}`,
    password,
    confirmPassword: password,
  };
  return { ...defaults, ...overrides };
}
