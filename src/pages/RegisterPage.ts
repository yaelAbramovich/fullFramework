import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export interface RegistrationFormData {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  ssn?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export type RegistrationFieldName = keyof RegistrationFormData;

export class RegisterPage extends BasePage {
  protected readonly urlPath = strings.pages.register.urlPath;

  private readonly heading: Locator;
  private readonly introParagraph: Locator;
  private readonly submitButton: Locator;
  private readonly form: Record<RegistrationFieldName, Locator>;

  public constructor(page: Page) {
    super(page, 'RegisterPage');

    this.heading = this.page
      .getByRole('heading', { level: 1, name: strings.pages.register.sectionHeadingText })
      .describe('"Signing up is easy!" section heading');

    this.introParagraph = this.page
      .getByText(strings.pages.register.sectionIntroParagraphText, { exact: true })
      .describe('"Signing up is easy!" section intro paragraph');

    this.submitButton = this.page
      .getByRole('button', { name: strings.pages.register.submitButtonAccessibleName })
      .describe('Register submit button');

    this.form = {
      firstName: this.page
        .getByRole('row', { name: strings.pages.register.firstNameRowAccessibleName })
        .getByRole('textbox')
        .describe('First Name field'),
      lastName: this.page
        .getByRole('row', { name: strings.pages.register.lastNameRowAccessibleName })
        .getByRole('textbox')
        .describe('Last Name field'),
      address: this.page
        .getByRole('row', { name: strings.pages.register.addressRowAccessibleName })
        .getByRole('textbox')
        .describe('Address field'),
      city: this.page
        .getByRole('row', { name: strings.pages.register.cityRowAccessibleName })
        .getByRole('textbox')
        .describe('City field'),
      state: this.page
        .getByRole('row', { name: strings.pages.register.stateRowAccessibleName })
        .getByRole('textbox')
        .describe('State field'),
      zipCode: this.page
        .getByRole('row', { name: strings.pages.register.zipCodeRowAccessibleName })
        .getByRole('textbox')
        .describe('Zip Code field'),
      phoneNumber: this.page
        .getByRole('row', { name: strings.pages.register.phoneNumberRowAccessibleName })
        .getByRole('textbox')
        .describe('Phone # field'),
      ssn: this.page
        .getByRole('row', { name: strings.pages.register.ssnRowAccessibleName })
        .getByRole('textbox')
        .describe('SSN field'),
      username: this.page
        .getByRole('row', { name: strings.pages.register.usernameRowAccessibleName })
        .getByRole('textbox')
        .describe('Username field'),
      password: this.page
        .getByRole('row', { name: strings.pages.register.passwordRowAccessibleName })
        .getByRole('textbox')
        .describe('Password field'),
      confirmPassword: this.page
        .getByRole('row', { name: strings.pages.register.confirmPasswordRowAccessibleName })
        .getByRole('textbox')
        .describe('Confirm password field'),
    };
  }

  public async fillField(fieldName: RegistrationFieldName, value: string): Promise<void> {
    await this.fillElementWithText(this.form[fieldName], value, `${fieldName} field`);
  }

  public async clickSubmit(): Promise<void> {
    await this.clickOnElement(this.submitButton, 'Register submit button');
  }

  public async fillForm(formData: RegistrationFormData): Promise<void> {
    for (const fieldName of Object.keys(formData) as RegistrationFieldName[]) {
      const value = formData[fieldName];
      if (value !== undefined) {
        await this.fillField(fieldName, value);
      }
    }
  }

  public async fillFormAndRegister(formData: RegistrationFormData): Promise<void> {
    await this.fillForm(formData);
    await this.clickSubmit();
  }

  public async assertSectionHeadingIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.heading, '"Signing up is easy!" section heading');
  }

  public async assertSectionIntroParagraphIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.introParagraph,
      '"Signing up is easy!" section intro paragraph',
    );
  }

  public async assertSubmitButtonIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.submitButton, 'Register submit button');
  }

  public async assertSigningUpSectionIsDisplayed(): Promise<void> {
    await this.assertSectionHeadingIsVisible();
    await this.assertSectionIntroParagraphIsVisible();
    await this.assertSubmitButtonIsVisible();
  }
}
