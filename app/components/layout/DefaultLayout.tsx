import { useDisclosure } from '@mantine/hooks';
import { AppShell, Burger, Flex, Text } from '@mantine/core';
import { Auth0Provider } from '@auth0/auth0-react';
import Authentication from "../authentication/Authentication";

export function DefaultLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
    >
      <AppShell.Header bg="primary">
        <Flex mih={50}
          gap="md"
          justify="space-between"
          align="center"
          direction="row"
          wrap="wrap"
          p="md">
          <div className="flex gap-2 items-center">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="md" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="md" />
            <Text>Menu</Text>
          </div>

          <div className=''>
            <Auth0Provider
              domain={import.meta.env.VITE_AUTH0_DOMAIN}
              clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
              authorizationParams={{
                redirect_uri: window.location.origin
              }}
            >
              <Authentication />
            </Auth0Provider>
          </div>
        </Flex>

      </AppShell.Header>
      <AppShell.Navbar p="md" bg="primary">
        You can collapse the Navbar both on desktop and mobile. After sm breakpoint, the navbar is
        no longer offset by padding in the main element and it takes the full width of the screen
        when opened.
      </AppShell.Navbar>
      <AppShell.Main>
        <Text>This is the main section, your app content here.</Text>
        <Text>The navbar is collapsible both on mobile and desktop. Nice!</Text>
        <Text>Mobile and desktop opened state can be managed separately.</Text>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}