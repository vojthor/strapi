import * as React from 'react';

import {
  AppInfoProvider,
  auth,
  LoadingIndicatorPage,
  useFetchClient,
  useGuidedTour,
} from '@strapi/helper-plugin';
import lodashGet from 'lodash/get';
import { useQueries } from 'react-query';
import lt from 'semver/functions/lt';
import valid from 'semver/functions/valid';
//  TODO: DS add loader

import packageJSON from '../../../package.json';
import { useConfiguration } from '../hooks/useConfiguration';
// @ts-expect-error - no types yet.
import { getFullName, hashAdminUserEmail } from '../utils';

import { NpsSurvey } from './NpsSurvey';
import { PluginsInitializer } from './PluginsInitializer';
import { RBACProvider, Permission } from './RBACProvider';

const strapiVersion = packageJSON.version;

const AuthenticatedApp = () => {
  const { setGuidedTourVisibility } = useGuidedTour();
  const userInfo = auth.get('userInfo');
  const userName = userInfo
    ? lodashGet(userInfo, 'username') || getFullName(userInfo.firstname, userInfo.lastname)
    : null;
  const [userDisplayName, setUserDisplayName] = React.useState(userName);
  const [userId, setUserId] = React.useState(null);
  const { showReleaseNotification } = useConfiguration();
  const { get } = useFetchClient();
  const [
    { data: appInfos, status },
    { data: tagName, isLoading },
    { data: permissions, status: fetchPermissionsStatus, refetch, isFetching },
    { data: userRoles },
  ] = useQueries([
    {
      queryKey: 'app-infos',
      async queryFn() {
        const { data } = await get('/admin/information');

        return data.data;
      },
    },
    {
      queryKey: 'strapi-release',
      async queryFn() {
        try {
          const res = await fetch('https://api.github.com/repos/strapi/strapi/releases/latest');

          if (!res.ok) {
            throw new Error('Failed to fetch latest Strapi version.');
          }

          const { tag_name } = await res.json();

          return tag_name;
        } catch (err) {
          // Don't throw an error
          return strapiVersion;
        }
      },
      enabled: showReleaseNotification,
      initialData: strapiVersion,
    },
    {
      queryKey: 'admin-users-permission',
      async queryFn() {
        const { data } = await get<{ data: Permission[] }>('/admin/users/me/permissions');

        return data.data;
      },
      initialData: [],
    },
    {
      queryKey: 'user-roles',
      async queryFn() {
        const {
          data: {
            data: { roles },
          },
        } = await get<{ data: { roles: [] } }>('/admin/users/me');

        return roles;
      },
    },
  ]);

  const shouldUpdateStrapi = checkLatestStrapiVersion(strapiVersion, tagName);

  /**
   * TODO: does this actually need to be an effect?
   */
  React.useEffect(() => {
    if (userRoles) {
      const isUserSuperAdmin = userRoles.find(({ code }) => code === 'strapi-super-admin');

      if (isUserSuperAdmin && appInfos?.autoReload) {
        setGuidedTourVisibility(true);
      }
    }
  }, [userRoles, appInfos, setGuidedTourVisibility]);

  React.useEffect(() => {
    const getUserId = async () => {
      const userId = await hashAdminUserEmail(userInfo);
      setUserId(userId);
    };

    getUserId();
  }, [userInfo]);

  // We don't need to wait for the release query to be fetched before rendering the plugins
  // however, we need the appInfos and the permissions
  const shouldShowNotDependentQueriesLoader =
    isFetching || status === 'loading' || fetchPermissionsStatus === 'loading';

  const shouldShowLoader = isLoading || shouldShowNotDependentQueriesLoader;

  if (shouldShowLoader) {
    return <LoadingIndicatorPage />;
  }

  // TODO: add error state
  if (status === 'error') {
    return <div>error...</div>;
  }

  return (
    <AppInfoProvider
      {...appInfos}
      userId={userId}
      latestStrapiReleaseTag={tagName}
      setUserDisplayName={setUserDisplayName}
      shouldUpdateStrapi={shouldUpdateStrapi}
      userDisplayName={userDisplayName}
    >
      <RBACProvider permissions={permissions ?? []} refetchPermissions={refetch}>
        <NpsSurvey />
        <PluginsInitializer />
      </RBACProvider>
    </AppInfoProvider>
  );
};

const checkLatestStrapiVersion = (
  currentPackageVersion: string,
  latestPublishedVersion: string
): boolean => {
  if (!valid(currentPackageVersion) || !valid(latestPublishedVersion)) {
    return false;
  }

  return lt(currentPackageVersion, latestPublishedVersion);
};

export { AuthenticatedApp };
