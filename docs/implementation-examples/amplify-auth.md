Authenticator
Authenticator component adds complete authentication flows to your application with minimal boilerplate.

Feedback
@aws-amplify/ui-react v5
The @aws-amplify/ui-react package is currently on version 6. Working with@aws-amplify/ui-react version 5 or earlier? See our migration guide.
The Authenticator component adds complete authentication flows to your application with minimal boilerplate.

Sign In
Create Account
Sign in
Username
Enter your Username
Password
Enter your Password
Quick start
Next.js 13.4+ introduces App Router with the usage of Server Components. Amplify UI components are interactive and designed to work on the client side. To use them inside of Server Components you must wrap them in a Client Component with "use client". For more info, visit Next.js third party package documentation.

If you are using Next.js Pages Router, no changes are required to use Amplify UI components.

Setup with Amplify Gen 2 backend
To get up and running with the Authenticator, follow the Amplify Gen2 quickstart guide.

Setup with Amplify Gen 1 backend
To setup Amplify using the Gen1 CLI, follow the steps below:

Step 1. Configure backend
The Authenticator works seamlessly with the Amplify CLI to automatically work with your backend.

First, update @aws-amplify/cli with npm or yarn if you're using a version before 6.4.0:

npm
yarn
npm install -g @aws-amplify/cli@latest
Now that you have the Amplify CLI installed, you can set up your Amplify project by running amplify init in your project's root directory. Then run amplify add auth and follow the prompts to add authentication to your backend configuration.

If you have an existing backend, run amplify pull to sync your aws-exports.js with your cloud backend.

You should now have an aws-exports.js file in your src/ directory with your latest backend configuration.

Step 2. Install dependencies
npm
yarn
npm install @aws-amplify/ui-react aws-amplify
Step 3. Add the Authenticator
The quickest way to get started is by wrapping your application with the Authenticator component. Once an end-user has created an account & signed in, the underlying component is rendered with access to the user.

You can use the Authenticator component directly, or wrap your app in withAuthenticator Higher-Order Component:

Authenticator
withAuthenticator
import React from 'react';
import { Amplify } from 'aws-amplify';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsExports from './aws-exports';
Amplify.configure(awsExports);

export default function App() {
return (
<Authenticator>
{({ signOut, user }) => (

<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
);
}

Configuration
How to setup and configure your Authenticator component.

Feedback
Wait!
Did you follow the quick start instructions to set up the Authenticator first?

Initial State
By default, unauthenticated users are redirected to the Sign In flow. You can explicitly redirect to Sign Up or Forgot Password:

Sign In
Sign Up
Forgot Password
export default function App() {
return (
<Authenticator>
{({ signOut, user }) => (

<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
);
}
Sign In
Create Account
Sign in
Username
Enter your Username
Password
Enter your Password
Login Mechanisms
Zero Configuration
The Authenticator automatically infers loginMechanisms from the current Amplify configuration, but can be explicitly defined as seen below.

Without the zero configuration, the Authenticator by default creates new users in the Amazon Cognito UserPool based on a unique username.

You can provide an alternative to username such as email or phone_number.

Note: A username, email, or phone_number value is required for Cognito User Pools. The username field will only work with Gen 1 Auth. For more information about using username see the docs.

Email
Phone Number
Username
<Authenticator loginMechanisms={['email']}>
{({ signOut, user }) => (

<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
Sign In
Create Account
Sign in
Email
Enter your Email
Password
Enter your Password
Sign Up Attributes
Zero Configuration
The Authenticator automatically infers signUpAttributes from amplify pull, but can be explicitly defined as seen below.

The Authenticator automatically renders most Cognito User Pools attributes, with the exception of address, gender, locale, picture, updated_at, and zoneinfo. Because these are often app-specific, they can be customized via Sign Up fields.

Verification Attributes
All Attributes
By default, the Authenticator will still require any attributes required for verification, such as email, even if signUpAttributes is empty:

export default function App() {
return (
<Authenticator signUpAttributes={[]}>
{({ signOut, user }) => (

<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
);
}
Sign In
Create Account

Username
Enter your Username
Password
Enter your Password
Confirm Password
Please confirm your Password
Email
Enter your Email
Social Providers
Zero Configuration
The Authenticator automatically infers socialProviders from amplify pull, but can be explicitly defined as seen below.

For your configured social providers, you can also provide amazon, facebook, or google:

export default function App() {
return (
<Authenticator socialProviders={['amazon', 'apple', 'facebook', 'google']}>
{({ signOut, user }) => (

<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
);
}
Sign In
Create Account
Sign in
Username
Enter your Username
Password
Enter your Password
Step by step video on setting up social providers.

Variation
The Authenticator has multiple variations to meet the needs of your application.

default
modal
By default, the Authenticator will render as a centered card within the container:

export default function App() {
return (
<Authenticator>
{({ signOut, user }) => (

<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
);
}
Sign In
Create Account
Sign in
Username
Enter your Username
Password
Enter your Password
Hide Sign Up
The Authenticator has an option to hide the sign up page including the Create Account tab.

Authenticator Example:

<Authenticator hideSignUp>
  <App />
</Authenticator>
withAuthenticator Example:

withAuthenticator(App, { hideSignUp: true });
Sign in
Username
Enter your Username
Password
Enter your Password

Customization
Override and customize your Authenticator.

Feedback
Headers & Footers
The Authenticator has several "slots" that you can customize to add messaging & functionality to meet your app's needs.

The following example customizes these slots with:

Custom header above the Authenticator with the Amplify logo
Custom footer below the Authenticator with © All Rights Reserved
Custom Sign In header with Sign in to your account
Custom Sign In footer with a Reset Password link
Custom Sign Up header with Create a new account
Custom Sign Up footer with a Back to Sign In link
Custom Confirm Sign Up header with an Enter Information header
Custom Confirm Sign Up footer with a Footer Information message
const components = {
Header() {
const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Image
          alt="Amplify logo"
          src="https://docs.amplify.aws/assets/logo-dark.svg"
        />
      </View>
    );

},

Footer() {
const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Text color={tokens.colors.neutral[80]}>
          &copy; All Rights Reserved
        </Text>
      </View>
    );

},

SignIn: {
Header() {
const { tokens } = useTheme();

      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Sign in to your account
        </Heading>
      );
    },
    Footer() {
      const { toForgotPassword } = useAuthenticator();

      return (
        <View textAlign="center">
          <Button
            fontWeight="normal"
            onClick={toForgotPassword}
            size="small"
            variation="link"
          >
            Reset Password
          </Button>
        </View>
      );
    },

},

SignUp: {
Header() {
const { tokens } = useTheme();

      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Create a new account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();

      return (
        <View textAlign="center">
          <Button
            fontWeight="normal"
            onClick={toSignIn}
            size="small"
            variation="link"
          >
            Back to Sign In
          </Button>
        </View>
      );
    },

},
ConfirmSignUp: {
Header() {
const { tokens } = useTheme();
return (
<Heading
padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
level={3} >
Enter Information:
</Heading>
);
},
Footer() {
return <Text>Footer Information</Text>;
},
},
SetupTotp: {
Header() {
const { tokens } = useTheme();
return (
<Heading
padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
level={3} >
Enter Information:
</Heading>
);
},
Footer() {
return <Text>Footer Information</Text>;
},
},
ConfirmSignIn: {
Header() {
const { tokens } = useTheme();
return (
<Heading
padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
level={3} >
Enter Information:
</Heading>
);
},
Footer() {
return <Text>Footer Information</Text>;
},
},
ForgotPassword: {
Header() {
const { tokens } = useTheme();
return (
<Heading
padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
level={3} >
Enter Information:
</Heading>
);
},
Footer() {
return <Text>Footer Information</Text>;
},
},
ConfirmResetPassword: {
Header() {
const { tokens } = useTheme();
return (
<Heading
padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
level={3} >
Enter Information:
</Heading>
);
},
Footer() {
return <Text>Footer Information</Text>;
},
},
};

const formFields = {
signIn: {
username: {
placeholder: 'Enter your email',
},
},
signUp: {
password: {
label: 'Password:',
placeholder: 'Enter your Password:',
isRequired: false,
order: 2,
},
confirm_password: {
label: 'Confirm Password:',
order: 1,
},
},
forceNewPassword: {
password: {
placeholder: 'Enter your Password:',
},
},
forgotPassword: {
username: {
placeholder: 'Enter your email:',
},
},
confirmResetPassword: {
confirmation_code: {
placeholder: 'Enter your Confirmation Code:',
label: 'New Label',
isRequired: false,
},
confirm_password: {
placeholder: 'Enter your Password Please:',
},
},
setupTotp: {
QR: {
totpIssuer: 'test issuer',
totpUsername: 'amplify_qr_test_user',
},
confirmation_code: {
label: 'New Label',
placeholder: 'Enter your Confirmation Code:',
isRequired: false,
},
},
confirmSignIn: {
confirmation_code: {
label: 'New Label',
placeholder: 'Enter your Confirmation Code:',
isRequired: false,
},
},
};

export default function App() {
return (
<Authenticator formFields={formFields} components={components}>
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Amplify logo
Login
Register
Sign in to your account
Log in
Enter your username
Enter your Username
Enter your password
Enter your Password
© All Rights Reserved

Override Function Calls
You can override the call to signUp, signIn, confirmSignIn, confirmSignUp, resendSignUpCode, forgotPassword and forgotPasswordSubmit functions. To override a call you must create a new services object with an async handle\* function that returns an aws-amplify Auth promise.

@aws-amplify/ui-react v5
Use resetPassword in place of forgotPassword in versions 5 and earlier of @aws-amplify/ui-react.

The service object must then be passed into the authenticator component as a services prop. For example, let's imagine you'd like to lowercase the username and the email attributes during signUp. This would be overriden like so:

@aws-amplify/ui-react v6 (latest)
@aws-amplify/ui-react v5 and below
In @aws-amplify/ui-react version 6, Auth function calls are imported directly as shown below.

import { Authenticator } from '@aws-amplify/ui-react';
import { signUp, SignUpInput } from 'aws-amplify/auth';

export default function App() {
const services = {
async handleSignUp(input: SignUpInput) {
// custom username and email
const { username, password, options } = input;
const customUsername = username.toLowerCase();
const customEmail = options?.userAttributes?.email.toLowerCase();
return signUp({
username: customUsername,
password,
options: {
...input.options,
userAttributes: {
...input.options?.userAttributes,
email: customEmail,
},
},
});
},
};
return (
<Authenticator services={services} initialState="signUp">
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Each handle* function accepts as input the expected input of its corresponding Auth function, allowing you to override the Auth function call from within the handle* function. Here is a table of each override function name, and the values passed as input.

@aws-amplify/ui-react v6 (latest)
@aws-amplify/ui-react v5
Auth Function Call Override Name input Properties
signUp handleSignUp {username, password}
signIn handleSignIn {username, password}
confirmSignIn handleConfirmSignIn {challengeResponse}
confirmSignUp handleConfirmSignUp {username, confirmationCode}
resendSignUpCode handleResendSignUpCode {username}
resetPassword handleForgotPassword {username}
confirmResetPassword handleForgotPasswordSubmit {username, newPassword, confirmationCode}
Internationalization (I18n)
The Authenticator ships with translations for:

en – English (default)
zh – Chinese
nl – Dutch
fr – French
de – German
he – Hebrew
id – Indonesian
it – Italian
ja – Japanese
ko – Korean
nb - Norwegian
pl – Polish
pt – Portuguese
ru – Russian
es – Spanish
sv – Swedish
th - Thai
tr – Turkish
ua – Ukrainian
These translations can be customized using the Amplify JS' I18n module:

Note: The import path for i18n changed from aws-amplify to aws-amplify/utils in aws-amplify@6

import { I18n } from 'aws-amplify/utils';
import { translations } from '@aws-amplify/ui-react';
I18n.putVocabularies(translations);
I18n.setLanguage('fr');

I18n.putVocabularies({
fr: {
'Sign In': 'Se connecter',
'Sign Up': "S'inscrire",
},
es: {
'Sign In': 'Registrarse',
'Sign Up': 'Regístrate',
},
});
The list of available keys are available here.

Confirm Sign Up Page Translations
The confirm sign up page has a few specialized strings that can be translated. These include:

`Your code is on the way. To log in, enter the code we emailed to`

`Your code is on the way. To log in, enter the code we texted to`

`Your code is on the way. To log in, enter the code we sent you. It may take a minute to arrive.`

`It may take a minute to arrive.`
Translations Needed 📖
If you see any missing translations or would like to contribute a new language, we greatly appreciate contributions to translations we have here.

Labels & Text
Using the same techniques as Internationalization (I18n), you can customize the labels and text of the components:

Default Values

Compare the default labels here to those in the customized screens below.

Because I18n manages global translations, customizing these will affect all translations of these strings (including those on this page!).

Login
Register
Log in
Enter your username
Enter your Username
Enter your password
Enter your Password
Sign In

Sign Up

Forgot Password

Setup TOTP

Sign Up Fields
The following example customizes the Sign Up screen by:

Re-using the default Sign Up form fields
Appending a custom "Terms and Conditions" checkbox with a validateCustomSignUp service
Note: In the example code below, preferred_username is not set as an attribute because it has already been defined through Zero Configuration. You may also notice that the acknowledgement field is not being sent. This occurs since acknowledgement is not a known attribute to Cognito. To assign it as a custom attribute instead, the name field must have the custom: prefix.

export default function App() {
return (
<Authenticator
// Default to Sign Up screen
initialState="signUp"
// Customize `Authenticator.SignUp.FormFields`
components={{
SignUp: {
FormFields() {
const { validationErrors } = useAuthenticator();

            return (
              <>
                {/* Re-use default `Authenticator.SignUp.FormFields` */}
                <Authenticator.SignUp.FormFields />

                {/* Append & require Terms and Conditions field to sign up  */}
                <CheckboxField
                  errorMessage={validationErrors.acknowledgement as string}
                  hasError={!!validationErrors.acknowledgement}
                  name="acknowledgement"
                  value="yes"
                  label="I agree with the Terms and Conditions"
                />
              </>
            );
          },
        },
      }}
      services={{
        async validateCustomSignUp(formData) {
          if (!formData.acknowledgement) {
            return {
              acknowledgement: 'You must agree to the Terms and Conditions',
            };
          }
        },
      }}
    >
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user.username}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>

);
}
Login
Register

Enter your email
Enter your Email
Enter your password
Enter your Password
Confirm your password
Please confirm your Password
Preferred Username
Enter your Preferred Username

I agree with the Terms and Conditions
You must agree to the Terms and Conditions

If you'd like to add an attribute please first consider using the Sign Up Attributes prop. In some instances you may want to add an app-specific attribute. In those cases you can add a new form element to the Sign Up form fields. Be aware the HTML name attribute on the new form field must match the name of the Cognito attribute. If the cognito attribute is a custom attribute it must have the custom: prefix in the HTML attribute name.

const formFields = {
signUp: {
email: {
order:1
},
password: {
order: 2
},
confirm_password: {
order: 3
},
'custom:your_custom_attribute': {
order: 4
}
},
}
Force New Password Fields
The following example customizes the Force New Password screen by:

Re-using the default Force New Password form fields
Appending a custom "Zone Info" text field
<Authenticator
initialState="signUp"
components={{
        ForceNewPassword: {
          FormFields() {
            return (
              <>
                <Authenticator.ForceNewPassword.FormFields />
                <TextField
                  label="Zone Info"
                  id="12233"
                  placeholder="Zone Info"
                  name="zoneinfo"
                  type="text"
                ></TextField>
              </>
            );
          },
        },
      }} >
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Sign Up Field Order
The authenticator allows a custom order of sign up fields on the Sign Up page.

Order is determined by a formFields prop that is passed into the Authenticator component. This prop will have the signUp key with a list of all the input fields. Each input field will have an order key that specifies which order it will be displayed on the page.

In the example below the order will be set as email, family_name, birthdate, preferred_username, password and finally confirm_password.

Note: Fields that do not have a order key will be displayed at the bottom of the Sign Up page. The order key can also be combined with other form field updates. In addition, typically attributes added to the sign up page have already been inferred through Zero Configuration. However, you can explicitly set the sign up attributes prop to add these to the sign up page if needed.

const formFields = {
signUp: {
email: {
order:1
},
family_name: {
order: 2
},
preferred_username: {
order: 4
},
birthdate: {
order: 3
},
password: {
order: 5
},
confirm_password: {
order: 6
}
},
}

// Adding the signUpAttributes prop is typically not needed since attributes are inferred via Zero Configuration.
// For the sake of this example they have been explicitly added so you can copy and paste this into your own application and see it work.
const signUpAttributes={['birthdate', 'family_name', 'preferred_username']}

export default function App() {
return (
<Authenticator formFields={formFields} signUpAttributes={signUpAttributes}>
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Login
Register

Enter your email
Enter your Email
Family Name
Enter your Family Name
Birthdate

yyyy/mm/dd
Preferred Username
Enter your Preferred Username
Enter your password
Enter your Password
Confirm your password
Please confirm your Password
Form Field Customization
The Authenticator allows for customization of multiple aspects of the form fields. The sections below will describe several use cases, on how to modify these fields.

Overall, the following attributes are allowed to be modified on any input as described in the labels and placeholder section:

placeholder label

Additionally, you'll be able to show or hide the label of each form field by using labelHidden and set a field to required or not required with isRequired.

For customers wishing to change a phone number field, a new dialCode and dialCodeList key are now available as described in the dialCode and dialCodeList.

For a full list of component names and field names can be found in the input form table.

Updating labels, placeholders, required fields and showing labels
You can customize any label, placeholder, set a field as required or not required, and hide or show labels by configuring the formFields props, and passing it into the Authenticator component. To use this feature create a formFields prop and include the component name as a key. Inside that object you can list all the inputs you'd like to change by their name. Inputs can have additional client side validation by following HTML form validation standards.

Note: Specifying formFields for a given field will overwrite any default attributes. To include defaults, you must re-specify them as shown below.

The following example customizes the Sign In page by:

Updating the placeholder with placeholder.
Setting required to true with isRequired. username is required by default, but as mentioned above, default attributes will be overwritten and must be re-declared when using formFields.
Updating the label text with label.
Show the label using labelHidden set to false.
Note: On the sign in page the input name is always username, regardless of the login mechanism type.

const formFields = {
signIn: {
username: {
placeholder: 'Enter Your Email Here',
isRequired: true,
label: 'Email:'
},
},
}

export default function App() {
return (
<Authenticator formFields={formFields}>
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Login
Register
Log in
Email:
Enter Your Email Here
Enter your password
Enter your Password
Default international dial code
Default Dial code customization is available via the dialCode form field key.

The following example will set the default dial code to +227 on the Sign Up and Sign In page.

const formFields = {
signIn: {
username: {
dialCode: '+227'
},
},
signUp: {
phone_number: {
dialCode: '+227'
},
},
}

export default function App() {
return (
<Authenticator formFields={formFields}>
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Login
Register
Log in
Enter your phone number
Country code

+227
Enter your Phone Number
Enter your password
Enter your Password
Change dial code list
If needed, you can update the list of dial codes shown to the user by assigning an array of dial codes to the dialCodeList.

In this example, only four dial codes are show in the drop down list for the sign in and sign up pages.

Note: Make sure to add the plus sign to each dial code in the dialCodeList.

const formFields = {
signIn: {
username: {
dialCodeList: ['+1', '+123', '+227', '+229']
},
},
signUp: {
phone_number: {
dialCodeList: ['+1', '+123', '+227', '+229']
},
},
}

export default function App() {
return (
<Authenticator formFields={formFields}>
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Login
Register
Log in
Enter your phone number
Country code

+1
Enter your Phone Number
Enter your password
Enter your Password
Input Form Field Names Table
Here are the various components and input names that are available for customization.

Component Name Form Field Names
signIn username password
signUp email phone_number username password confirm_password preferred_username birthdate family_name middle_name given_name name nickname profile website
confirmSignUp confirmation_code
forgotPassword username
confirmResetPassword confirmation_code password confirm_password
forceNewPassword password confirm_password
setupTotp confirmation_code
confirmSignIn confirmation_code
confirmVerifyUser confirmation_code
Note: Custom sign up attributes not listed in this table are customizable. Use the form field name as the key.

Update Setup TOTP QR Issuer and Username
When setting up TOTP you can customize the issuer and username that will be shown in TOTP applications. This can be done by adding the formFields prop to the Authenticator component with a setupTotp key. The setupTotp should have a QR key with a totpIssuer and or totpUsername as seen in the example below.

Note: Unless changed, the default issuer is AWSCognito and username will be the current user.username for the user signing up.

const formFields = {
setupTotp: {
QR: {
totpIssuer: 'test issuer',
totpUsername: 'amplify_qr_test_user',
},
},
}

export default function App() {
return (
<Authenticator formFields={formFields}>
{({ signOut }) => <button onClick={signOut}>Sign out</button>}
</Authenticator>
);
}
Styling
You can customize the Authenticator's default style by using CSS variables.

CSS style
The example below uses a <style> tag to change the appearance of some of the components used for the Authenticator:

[data-amplify-authenticator] {
--amplify-components-authenticator-router-box-shadow: 0 0 16px var(--amplify-colors-overlay-10);
--amplify-components-authenticator-router-border-width: 0;
--amplify-components-authenticator-form-padding: var(--amplify-space-medium) var(--amplify-space-xl) var(--amplify-space-xl);
--amplify-components-button-primary-background-color: var(--amplify-colors-neutral-100);
--amplify-components-fieldcontrol-focus-box-shadow: 0 0 0 2px var(--amplify-colors-purple-60);
--amplify-components-tabs-item-active-border-color: var(--amplify-colors-neutral-100);
--amplify-components-tabs-item-color: var(--amplify-colors-neutral-80);
--amplify-components-tabs-item-active-color: var(--amplify-colors-purple-100);
--amplify-components-button-link-color: var(--amplify-colors-purple-80);
}

Login
Register
Log in
Enter your username
Enter your Username
Enter your password
Enter your Password
Theme Provider Theme
Below is an example of updating the style of the Authenticator by using the ThemeProvider theme object. To do this, you must surround the Authenticator in the ThemeProvider.

Then create a theme object, with all your font and color updates. Feel free to use design tokens, as a way of designing your theme further.

import {
Authenticator,
ThemeProvider,
Theme,
useTheme,
View,
} from '@aws-amplify/ui-react';
export function AuthStyle() {
const { tokens } = useTheme();
const theme: Theme = {
name: 'Auth Example Theme',
tokens: {
components: {
authenticator: {
router: {
boxShadow: `0 0 16px ${tokens.colors.overlay['10']}`,
borderWidth: '0',
},
form: {
padding: `${tokens.space.medium} ${tokens.space.xl} ${tokens.space.medium}`,
},
},
button: {
primary: {
backgroundColor: tokens.colors.neutral['100'],
},
link: {
color: tokens.colors.purple['80'],
},
},
fieldcontrol: {
\_focus: {
boxShadow: `0 0 0 2px ${tokens.colors.purple['60']}`,
},
},
tabs: {
item: {
color: tokens.colors.neutral['80'],
\_active: {
borderColor: tokens.colors.neutral['100'],
color: tokens.colors.purple['100'],
},
},
},
},
},
};

return (
<ThemeProvider theme={theme}>
<View padding="xxl">
<Authenticator />
</View>
</ThemeProvider>
);
}
Login
Register
Log in
Enter your username
Enter your Username
Enter your password
Enter your Password
If you have TypeScript enabled, all the object keys will be present when creating the theme object. This will help speed up your development time while creating themes.

Additional CSS Styling
You can also override the authenticator's amplify-\* classes. For example, if you'd like to update the primary color of your submit button you can override the amplify-button class.

.amplify-button--primary {
background: linear-gradient(
to right,
var(--amplify-colors-green-80),
var(--amplify-colors-orange-40)
);
}

Advanced Usage
Access Authenticator UI component state outside of the UI component

Feedback
You must render the Authenticator UI component before using the useAuthenticator hook. This hook was designed to retrieve Authenticator UI specific state such as route and user and should not be used without the UI component.

useAuthenticator Hook
@aws-amplify/ui-react ships with useAuthenticator React hook that can be used to access, modify, and update Authenticator's auth state. To use them, you must render the Authenticator and wrap your application with <Authenticator.Provider>:

import { Authenticator } from '@aws-amplify/ui-react';

export default () => (
<Authenticator.Provider>
<App />
</Authenticator.Provider>
);
Then, you can use useAuthenticator on your App:

import { useAuthenticator } from '@aws-amplify/ui-react';

const App = () => {
const { user, signOut } = useAuthenticator((context) => [context.user]);
// ...
};
Authenticator Provider
In advanced use cases where usage of the useAuthenticator hook outside the scope of the Authenticator is needed, wrap your application inside an Authenticator.Provider. The Authenticator.Provider guarantees that the useAuthenticator hook is available throughout your application.

Create React App
Next.js
import { Authenticator, View } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // default theme

export default function App() {
return (
<Authenticator.Provider>
<View>Your app here</View>
</Authenticator.Provider>
);
};
Prevent Re-renders
Using useAuthenticator hook at your App level is risky, because it'll trigger a re-render down its tree whenever any of its context changes value.

To prevent undesired re-renders, you can pass a function to useAuthenticator that takes in Authenticator context and returns an array of desired context values. The hook will only trigger re-render if any of the array values change.

For example, you can ensure useAuthenticator to only reevaluate when its user context changes:

import { useAuthenticator } from '@aws-amplify/ui-react';

// hook below is only reevaluated when `user` changes
const { user, signOut } = useAuthenticator((context) => [context.user]);
Access Auth State
You can use useAuthenticator hook to access route string that represents the current authState. They can be one of:

idle
setup
signIn
signUp
confirmSignIn
confirmSignUp
setupTotp
forceNewPassword
forgotPassword
confirmResetPassword
verifyUser
confirmVerifyUser
signOut
authenticated
import { useAuthenticator } from '@aws-amplify/ui-react';

const App = () => {
const { route } = useAuthenticator(context => [context.route]);

// Use the value of route to decide which page to render
return route === 'authenticated' ? <Home /> : <Authenticator />;
};
Authentication Check
If you just need to check if you're authenticated or not, you can use the more straightforward useAuthenticator hook to access the authStatus string. The authStatus string can represent the following states:

configuring
authenticated
unauthenticated
The configuring state only occurs when the Authenticator is first loading.

import { useAuthenticator } from '@aws-amplify/ui-react';

const App = () => {
const { authStatus } = useAuthenticator(context => [context.authStatus]);

// Use the value of authStatus to decide which page to render
return (
<>
{authStatus === 'configuring' && 'Loading...'}
{authStatus !== 'authenticated' ? <Authenticator /> : <Home />}
</>
);
};
Access Authenticated User
You can use useAuthenticator hook to access current signed in user. If no user is authenticated, it'll return undefined.

import { useAuthenticator } from '@aws-amplify/ui-react';

const Home = () => {
const { user, signOut } = useAuthenticator((context) => [context.user]);

return (
<>
<h2>Welcome, {user.username}!</h2>
<button onClick={signOut}>Sign Out</button>
</>
);
};
Trigger Transitions
You can use useAuthenticator hook to access functions that lets you trigger transitions to the authenticator. Please see Full API to see all supported transition functions. Any invalid transitions (e.g. signUp directly to authenticated) will be ignored.

import { useAuthenticator } from '@aws-amplify/ui-react';

const Home = () => {
const { user, signOut } = useAuthenticator((context) => [context.user]);

return <button onClick={signOut}>Welcome, {user.username}!</button>;
};
Example
Here's an example that uses the toForgotPassword trigger transition, to create a custom button. Note that example uses the Footer "slot" override.

import '@aws-amplify/ui-react/styles.css';
import {
Authenticator,
View,
Button,
useAuthenticator,
} from '@aws-amplify/ui-react';

export default function App() {
const components = {
SignIn: {
Footer() {
const { toForgotPassword } = useAuthenticator();
return (
<View textAlign="center">
<Button fontWeight="normal" onClick={toForgotPassword} size="small">
Forgot Password???
</Button>
</View>
);
},
},
};

return (
<Authenticator components={components}>
{({ signOut, user }) => (
<main>
<h1>Hello {user.username}</h1>
<button onClick={signOut}>Sign out</button>
</main>
)}
</Authenticator>
);
}

Full API
Below is the full list of context that useAuthenticator hook returns.

Access Contexts
Trigger Transition
These are readonly contexts that represent the current auth state. Any unapplicable context will be undefined.

Name Description Type
user Current signed in user AuthUser
route Name of the auth flow user is in string
error Any error returned from service API call string
validationErrors Any form validation errors found. Maps each error message to respective input name. Record<string, string>
hasValidationErrors Whether there are any form validation errors boolean
isPending Whether service API call is in progress boolean
codeDeliveryDetail Provides detail on where confirm sign up code is sent to. CodeDeliveryDetail
