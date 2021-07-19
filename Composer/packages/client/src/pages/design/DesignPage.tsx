// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import { RouteComponentProps } from '@reach/router';
import { useRecoilValue } from 'recoil';
import { Split, SplitMeasuredSizes } from '@geoffcox/react-splitter';

import { dispatcherState, localBotsDataSelector } from '../../recoilModel';
import { getSensitiveProperties } from '../../recoilModel/dispatchers/utils/project';

import { renderThinSplitter } from '../../components/Split/ThinSplitter';
import { Conversation } from '../../components/Conversation';

import SideBar from './SideBar';
import CommandBar from './CommandBar';
import VisualPanel from './VisualPanel';
import PropertyPanel from './PropertyPanel';
import useEmptyPropsHandler from './useEmptyPropsHandler';
import { contentWrapper, splitPaneContainer, splitPaneWrapper } from './styles';
import Modals from './Modals';
import { PluginHost } from '../../components/PluginHost/PluginHost';
import { PluginAPI } from '../../../src/plugins/api';
import { Fragment, useState, useEffect, useMemo } from 'react';

import { AuthClient } from '../../utils/authClient';
import { azurePublishSurface } from '../publish/styles';
import { getTokenFromCache, userShouldProvideTokens, setTenantId, getTenantIdFromCache } from '../../utils/auth';
import { graphScopes } from '../../constants';
import { Dialog } from 'office-ui-fabric-react/lib/Dialog';
import {
  initUpdaterStatus,
  generateBotPropertyData,
  generateBotStatusList,
  deleteNotificationInterval,
} from '../publish/publishPageUtils';

const DesignPage: React.FC<RouteComponentProps<{ dialogId: string; projectId: string; skillId?: string }>> = (
  props
) => {
  const { projectId = '', skillId, location } = props;
  const [provision, setProvision] = useState(false);
  const [recievedMessage, setReceivedMessage] = useState('');
  const botProjectData = useRecoilValue(localBotsDataSelector);
  // bot propertyData
  const { botPropertyData, botList } = useMemo(() => {
    return generateBotPropertyData(botProjectData);
  }, [botProjectData]);

  useEmptyPropsHandler(projectId, location, skillId, props.dialogId);
  const { setPageElementState, publishToTarget } = useRecoilValue(dispatcherState);
  const { provisionToTarget, addNotification } = useRecoilValue(dispatcherState);

  const onMeasuredSizesChanged = (sizes: SplitMeasuredSizes) => {
    setPageElementState('dialogs', { leftSplitWidth: sizes.primary });
  };

  // setup plugin APIs
  useEffect(() => {
    PluginAPI.publish.closeDialog = () => {
      //setProvision(false)
    };
    PluginAPI.publish.onBack = () => {
      console.log('onBack');
    };

    PluginAPI.publish.getTokenFromCache = () => {
      return {
        accessToken: getTokenFromCache('accessToken'),
        graphToken: getTokenFromCache('graphToken'),
      };
    };
    /** @deprecated use `userShouldProvideTokens` instead */
    PluginAPI.publish.isGetTokenFromUser = () => {
      return userShouldProvideTokens();
    };
    PluginAPI.publish.userShouldProvideTokens = () => {
      return userShouldProvideTokens();
    };
    PluginAPI.publish.setTitle = (value) => {
      console.log('set title');
    };
    PluginAPI.publish.getTenantIdFromCache = () => {
      return getTenantIdFromCache();
    };
    PluginAPI.publish.setTenantId = (value) => {
      setTenantId(value);
    };
    window.addEventListener('message', handleEvent);
    return () => {
      window.removeEventListener('message', handleEvent);
    };
  }, []);

  function handleEvent(e) {
    //event goes here, format as you need
    if (
      typeof e.data != 'string' ||
      !e.data.includes('iframeComm') ||
      e.origin != 'https://ocbotcomposer.crm.dynamics.com'
    ) {
      return;
    }
    setReceivedMessage(e.data);
    console.log(JSON.parse(e.data).info);
  }

  useEffect(() => {
    let myconfig = {
      hostname: 'seehowprovision',
      location: 'eastus2',
      luisLocation: 'westus',
      name: 'testbot',
      resourceGroup: 't-yujinchorg',
      subscription: '23f5367c-d006-4464-8de1-57141d52e809',
      tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
      type: 'azurePublish',
      externalResources: [
        {
          description: 'Required registration allowing your bot to communicate with Azure services.',
          text: 'Microsoft Application Registration',
          tier: 'Free',
          group: 'Azure Hosting',
          key: 'appRegistration',
          required: true,
          name: 'seehowprovision',
          icon:
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iLTY1MTguNzgiIHkxPSIxMTE4Ljg2IiB4Mj0iLTY1MTguNzgiIHkyPSIxMDkwLjA2IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC41IDAgMCAtLjUgMzI2Ny40MiA1NTkuOTkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNWVhMGVmIi8+PHN0b3Agb2Zmc2V0PSIuMTgiIHN0b3AtY29sb3I9IiM1ODllZWQiLz48c3RvcCBvZmZzZXQ9Ii40MSIgc3RvcC1jb2xvcj0iIzQ4OTdlOSIvPjxzdG9wIG9mZnNldD0iLjY2IiBzdG9wLWNvbG9yPSIjMmU4Y2UxIi8+PHN0b3Agb2Zmc2V0PSIuOTQiIHN0b3AtY29sb3I9IiMwYTdjZDciLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDc4ZDQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBkPSJNNS42NyAxMC42MUgxMHY0LjMySDUuNjd6bS01LTUuNzZINVYuNTNIMS4yM2EuNi42IDAgMDAtLjYuNnptLjYgMTAuMDhINXYtNC4zMkguNjN2My43MmEuNi42IDAgMDAuNi42em0tLjYtNUg1VjUuNTdILjYzem0xMC4wOCA1aDMuNzJhLjYuNiAwIDAwLjYtLjZ2LTMuNzJoLTQuMzZ6bS01LTVIMTBWNS41N0g1LjY3em01IDBIMTVWNS41N2gtNC4yOXptMC05LjM2djQuMjhIMTVWMS4xM2EuNi42IDAgMDAtLjYtLjZ6bS01IDQuMzJIMTBWLjUzSDUuNjd6IiBmaWxsPSJ1cmwoI2EpIi8+PHBhdGggZmlsbD0iIzMyYmVkZCIgZD0iTTE3LjM3IDEwLjd2NC41MWwtMy44NyAyLjI2di00LjUxbDMuODctMi4yNnoiLz48cGF0aCBmaWxsPSIjOWNlYmZmIiBkPSJNMTcuMzcgMTAuN2wtMy44NyAyLjI3LTMuODctMi4yNyAzLjg3LTIuMjYgMy44NyAyLjI2eiIvPjxwYXRoIGZpbGw9IiM1MGU2ZmYiIGQ9Ik0xMy41IDEyLjk3djQuNWwtMy44Ny0yLjI2VjEwLjdsMy44NyAyLjI3eiIvPjxwYXRoIGZpbGw9IiM5Y2ViZmYiIGQ9Ik05LjYzIDE1LjIxbDMuODctMi4yNXY0LjUxbC0zLjg3LTIuMjZ6Ii8+PHBhdGggZmlsbD0iIzUwZTZmZiIgZD0iTTE3LjM3IDE1LjIxbC0zLjg3LTIuMjV2NC41MWwzLjg3LTIuMjZ6Ii8+PC9zdmc+',
        },
        {
          description:
            'App Service Web Apps lets you quickly build, deploy, and scale enterprise-grade web, mobile, and API apps running on any platform. Hosting for your bot.',
          text: 'Azure Hosting',
          tier: 'S1 Standard',
          group: 'Azure Hosting',
          key: 'webApp',
          required: true,
          name: 'seehowprovision',
          icon:
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iNC40IiB5MT0iMTEuNDgiIHgyPSI0LjM3IiB5Mj0iNy41MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjIiB4MT0iMTAuMTMiIHkxPSIxNS40NSIgeDI9IjEwLjEzIiB5Mj0iMTEuOSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJkIiB4MT0iMTQuMTgiIHkxPSIxMS4xNSIgeDI9IjE0LjE4IiB5Mj0iNy4zOCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iMTM0MjguODEiIGN5PSIzNTE4Ljg2IiByPSI1Ni42NyIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguMTUgMCAwIC4xNSAtMjAwNS4zMyAtNTE4LjgzKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjE4IiBzdG9wLWNvbG9yPSIjNWVhMGVmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDA3OGQ0Ii8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTE0LjIxIDE1LjcyQTguNSA4LjUgMCAwMTMuNzkgMi4yOGwuMDktLjA2YTguNSA4LjUgMCAwMTEwLjMzIDEzLjUiIGZpbGw9InVybCgjYSkiLz48cGF0aCBkPSJNNi42OSA3LjIzYTEzIDEzIDAgMDE4LjkxLTMuNTggOC40NyA4LjQ3IDAgMDAtMS40OS0xLjQ0IDE0LjM0IDE0LjM0IDAgMDAtNC42OSAxLjEgMTIuNTQgMTIuNTQgMCAwMC00LjA4IDIuODIgMi43NiAyLjc2IDAgMDExLjM1IDEuMXpNMi40OCAxMC42NWExNy44NiAxNy44NiAwIDAwLS44MyAyLjYyIDcuODIgNy44MiAwIDAwLjYyLjkyYy4xOC4yMy4zNS40NC41NS42NWExNy45NCAxNy45NCAwIDAxMS4wOC0zLjQ3IDIuNzYgMi43NiAwIDAxLTEuNDItLjcyeiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjYiLz48cGF0aCBkPSJNMy40NiA2LjExYTEyIDEyIDAgMDEtLjY5LTIuOTQgOC4xNSA4LjE1IDAgMDAtMS4xIDEuNDVBMTIuNjkgMTIuNjkgMCAwMDIuMjQgN2EyLjY5IDIuNjkgMCAwMTEuMjItLjg5eiIgZmlsbD0iI2YyZjJmMiIgb3BhY2l0eT0iLjU1Ii8+PGNpcmNsZSBjeD0iNC4zOCIgY3k9IjguNjgiIHI9IjIuNzMiIGZpbGw9InVybCgjYikiLz48cGF0aCBkPSJNOC4zNiAxMy42N2ExLjc3IDEuNzcgMCAwMS41NC0xLjI3IDExLjg4IDExLjg4IDAgMDEtMi41My0xLjg2IDIuNzQgMi43NCAwIDAxLTEuNDkuODMgMTMuMSAxMy4xIDAgMDAxLjQ1IDEuMjggMTIuMTIgMTIuMTIgMCAwMDIuMDUgMS4yNSAxLjc5IDEuNzkgMCAwMS0uMDItLjIzek0xNC42NiAxMy44OGExMiAxMiAwIDAxLTIuNzYtLjMyLjQxLjQxIDAgMDEwIC4xMSAxLjc1IDEuNzUgMCAwMS0uNTEgMS4yNCAxMy42OSAxMy42OSAwIDAwMy40Mi4yNEE4LjIxIDguMjEgMCAwMDE2IDEzLjgxYTExLjUgMTEuNSAwIDAxLTEuMzQuMDd6IiBmaWxsPSIjZjJmMmYyIiBvcGFjaXR5PSIuNTUiLz48Y2lyY2xlIGN4PSIxMC4xMyIgY3k9IjEzLjY3IiByPSIxLjc4IiBmaWxsPSJ1cmwoI2MpIi8+PHBhdGggZD0iTTEyLjMyIDguOTNhMS44MyAxLjgzIDAgMDEuNjEtMSAyNS41IDI1LjUgMCAwMS00LjQ2LTQuMTQgMTYuOTEgMTYuOTEgMCAwMS0yLTIuOTIgNy42NCA3LjY0IDAgMDAtMS4wOS40MiAxOC4xNCAxOC4xNCAwIDAwMi4xNSAzLjE4IDI2LjQ0IDI2LjQ0IDAgMDA0Ljc5IDQuNDZ6IiBmaWxsPSIjZjJmMmYyIiBvcGFjaXR5PSIuNyIvPjxjaXJjbGUgY3g9IjE0LjE4IiBjeT0iOS4yNyIgcj0iMS44OSIgZmlsbD0idXJsKCNkKSIvPjxwYXRoIGQ9Ik0xNy4zNSAxMC41NGwtLjM1LS4xNy0uMy0uMTZoLS4wNmwtLjI2LS4yMWgtLjA3TDE2IDkuOGExLjc2IDEuNzYgMCAwMS0uNjQuOTJjLjEyLjA4LjI1LjE1LjM4LjIybC4wOC4wNS4zNS4xOS44Ni40NWE4LjYzIDguNjMgMCAwMC4yOS0xLjExeiIgZmlsbD0iI2YyZjJmMiIgb3BhY2l0eT0iLjU1Ii8+PGNpcmNsZSBjeD0iNC4zOCIgY3k9IjguNjgiIHI9IjIuNzMiIGZpbGw9InVybCgjYikiLz48Y2lyY2xlIGN4PSIxMC4xMyIgY3k9IjEzLjY3IiByPSIxLjc4IiBmaWxsPSJ1cmwoI2MpIi8+PC9zdmc+',
        },
        {
          description:
            'When registered with the Azure Bot Service, you can host your bot in any environment and enable customers from a variety of channels, such as your app or website, Direct Line Speech, Microsoft Teams and more.',
          text: 'Microsoft Bot Channels Registration',
          tier: 'F0',
          group: 'Azure Hosting',
          key: 'botRegistration',
          required: true,
          name: 'seehowprovision',
          icon:
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iNTUuNzEiIGN5PSI3MS45MiIgcj0iOSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguOTQgMCAwIC45NCAtNDMuNjEgLTU4LjkyKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjY3IiBzdG9wLWNvbG9yPSIjNmJiOWYyIi8+PHN0b3Agb2Zmc2V0PSIuNzQiIHN0b3AtY29sb3I9IiM2MWI0ZjEiLz48c3RvcCBvZmZzZXQ9Ii44NSIgc3RvcC1jb2xvcj0iIzQ3YThlZiIvPjxzdG9wIG9mZnNldD0iLjk5IiBzdG9wLWNvbG9yPSIjMWQ5NGViIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMWI5M2ViIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTkgLjVBOC41IDguNSAwIDEwMTcuNSA5IDguNSA4LjUgMCAwMDkgLjV6IiBmaWxsPSJ1cmwoI2EpIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjcuMDMiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI3LjQ1IiBjeT0iOSIgcj0iLjc3IiBmaWxsPSIjMzJiZWRkIi8+PHBhdGggZD0iTTUuMjYgNi44aC0uMzhhLjI5LjI5IDAgMDAtLjI5LjI5djUuNzJhLjU5LjU5IDAgMDAuNTkuNTloNS41N2EuMjkuMjkgMCAwMC4yOS0uM3YtLjM4YS4yOS4yOSAwIDAwLS4yOS0uMjloLTVhLjE0LjE0IDAgMDEtLjE0LS4xNVY3LjA5YS4yOS4yOSAwIDAwLS4zNS0uMjl6IiBmaWxsPSIjMzJiZWRkIi8+PGNpcmNsZSBjeD0iMTAuNTUiIGN5PSI5IiByPSIuNzciIGZpbGw9IiMzMmJlZGQiLz48cGF0aCBkPSJNMTIuNDIgNC42SDcuMjNhLjI5LjI5IDAgMDAtLjI5LjN2LjM4YS4yOS4yOSAwIDAwLjI5LjI5aDVhLjE1LjE1IDAgMDEuMTUuMTV2NS4xOWEuMjkuMjkgMCAwMC4yOS4yOWguMzhhLjI5LjI5IDAgMDAuMjktLjI5VjUuMTlhLjU5LjU5IDAgMDAtLjU4LS41OXoiIGZpbGw9IiMzMmJlZGQiLz48L3N2Zz4=',
        },
      ],
    };
    PluginAPI.publish.getPublishConfig = () => myconfig;
    PluginAPI.publish.currentProjectId = () => {
      return projectId;
    };
  }, [projectId]);

  useEffect(() => {
    PluginAPI.publish.getType = () => {
      return 'azurePublish';
    };
    PluginAPI.publish.getName = () => {
      return 'testName';
    };
    PluginAPI.publish.getSchema = () => {
      return undefined;
    };
    PluginAPI.publish.savePublishConfig = (config) => {
      console.log('whatever');
    };
    PluginAPI.publish.startProvision = async (config) => {
      if (projectId == '') {
        return;
      }
      // let myconfig = {
      //   hostname: 'seehowprovision',
      //   location: 'eastus2',
      //   luisLocation: 'westus',
      //   name: 'testbot',
      //   resourceGroup: 't-yujinchorg',
      //   subscription: '23f5367c-d006-4464-8de1-57141d52e809',
      //   tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
      //   type: 'azurePublish',
      //   externalResources: [
      //     {
      //       description: 'Required registration allowing your bot to communicate with Azure services.',
      //       text: 'Microsoft Application Registration',
      //       tier: 'Free',
      //       group: 'Azure Hosting',
      //       key: 'appRegistration',
      //       required: true,
      //       name: 'seehowprovision',
      //       icon:
      //         'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iLTY1MTguNzgiIHkxPSIxMTE4Ljg2IiB4Mj0iLTY1MTguNzgiIHkyPSIxMDkwLjA2IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC41IDAgMCAtLjUgMzI2Ny40MiA1NTkuOTkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNWVhMGVmIi8+PHN0b3Agb2Zmc2V0PSIuMTgiIHN0b3AtY29sb3I9IiM1ODllZWQiLz48c3RvcCBvZmZzZXQ9Ii40MSIgc3RvcC1jb2xvcj0iIzQ4OTdlOSIvPjxzdG9wIG9mZnNldD0iLjY2IiBzdG9wLWNvbG9yPSIjMmU4Y2UxIi8+PHN0b3Agb2Zmc2V0PSIuOTQiIHN0b3AtY29sb3I9IiMwYTdjZDciLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDc4ZDQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBkPSJNNS42NyAxMC42MUgxMHY0LjMySDUuNjd6bS01LTUuNzZINVYuNTNIMS4yM2EuNi42IDAgMDAtLjYuNnptLjYgMTAuMDhINXYtNC4zMkguNjN2My43MmEuNi42IDAgMDAuNi42em0tLjYtNUg1VjUuNTdILjYzem0xMC4wOCA1aDMuNzJhLjYuNiAwIDAwLjYtLjZ2LTMuNzJoLTQuMzZ6bS01LTVIMTBWNS41N0g1LjY3em01IDBIMTVWNS41N2gtNC4yOXptMC05LjM2djQuMjhIMTVWMS4xM2EuNi42IDAgMDAtLjYtLjZ6bS01IDQuMzJIMTBWLjUzSDUuNjd6IiBmaWxsPSJ1cmwoI2EpIi8+PHBhdGggZmlsbD0iIzMyYmVkZCIgZD0iTTE3LjM3IDEwLjd2NC41MWwtMy44NyAyLjI2di00LjUxbDMuODctMi4yNnoiLz48cGF0aCBmaWxsPSIjOWNlYmZmIiBkPSJNMTcuMzcgMTAuN2wtMy44NyAyLjI3LTMuODctMi4yNyAzLjg3LTIuMjYgMy44NyAyLjI2eiIvPjxwYXRoIGZpbGw9IiM1MGU2ZmYiIGQ9Ik0xMy41IDEyLjk3djQuNWwtMy44Ny0yLjI2VjEwLjdsMy44NyAyLjI3eiIvPjxwYXRoIGZpbGw9IiM5Y2ViZmYiIGQ9Ik05LjYzIDE1LjIxbDMuODctMi4yNXY0LjUxbC0zLjg3LTIuMjZ6Ii8+PHBhdGggZmlsbD0iIzUwZTZmZiIgZD0iTTE3LjM3IDE1LjIxbC0zLjg3LTIuMjV2NC41MWwzLjg3LTIuMjZ6Ii8+PC9zdmc+',
      //     },
      //     {
      //       description:
      //         'App Service Web Apps lets you quickly build, deploy, and scale enterprise-grade web, mobile, and API apps running on any platform. Hosting for your bot.',
      //       text: 'Azure Hosting',
      //       tier: 'S1 Standard',
      //       group: 'Azure Hosting',
      //       key: 'webApp',
      //       required: true,
      //       name: 'seehowprovision',
      //       icon:
      //         'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iNC40IiB5MT0iMTEuNDgiIHgyPSI0LjM3IiB5Mj0iNy41MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjIiB4MT0iMTAuMTMiIHkxPSIxNS40NSIgeDI9IjEwLjEzIiB5Mj0iMTEuOSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJkIiB4MT0iMTQuMTgiIHkxPSIxMS4xNSIgeDI9IjE0LjE4IiB5Mj0iNy4zOCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iMTM0MjguODEiIGN5PSIzNTE4Ljg2IiByPSI1Ni42NyIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguMTUgMCAwIC4xNSAtMjAwNS4zMyAtNTE4LjgzKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjE4IiBzdG9wLWNvbG9yPSIjNWVhMGVmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDA3OGQ0Ii8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTE0LjIxIDE1LjcyQTguNSA4LjUgMCAwMTMuNzkgMi4yOGwuMDktLjA2YTguNSA4LjUgMCAwMTEwLjMzIDEzLjUiIGZpbGw9InVybCgjYSkiLz48cGF0aCBkPSJNNi42OSA3LjIzYTEzIDEzIDAgMDE4LjkxLTMuNTggOC40NyA4LjQ3IDAgMDAtMS40OS0xLjQ0IDE0LjM0IDE0LjM0IDAgMDAtNC42OSAxLjEgMTIuNTQgMTIuNTQgMCAwMC00LjA4IDIuODIgMi43NiAyLjc2IDAgMDExLjM1IDEuMXpNMi40OCAxMC42NWExNy44NiAxNy44NiAwIDAwLS44MyAyLjYyIDcuODIgNy44MiAwIDAwLjYyLjkyYy4xOC4yMy4zNS40NC41NS42NWExNy45NCAxNy45NCAwIDAxMS4wOC0zLjQ3IDIuNzYgMi43NiAwIDAxLTEuNDItLjcyeiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjYiLz48cGF0aCBkPSJNMy40NiA2LjExYTEyIDEyIDAgMDEtLjY5LTIuOTQgOC4xNSA4LjE1IDAgMDAtMS4xIDEuNDVBMTIuNjkgMTIuNjkgMCAwMDIuMjQgN2EyLjY5IDIuNjkgMCAwMTEuMjItLjg5eiIgZmlsbD0iI2YyZjJmMiIgb3BhY2l0eT0iLjU1Ii8+PGNpcmNsZSBjeD0iNC4zOCIgY3k9IjguNjgiIHI9IjIuNzMiIGZpbGw9InVybCgjYikiLz48cGF0aCBkPSJNOC4zNiAxMy42N2ExLjc3IDEuNzcgMCAwMS41NC0xLjI3IDExLjg4IDExLjg4IDAgMDEtMi41My0xLjg2IDIuNzQgMi43NCAwIDAxLTEuNDkuODMgMTMuMSAxMy4xIDAgMDAxLjQ1IDEuMjggMTIuMTIgMTIuMTIgMCAwMDIuMDUgMS4yNSAxLjc5IDEuNzkgMCAwMS0uMDItLjIzek0xNC42NiAxMy44OGExMiAxMiAwIDAxLTIuNzYtLjMyLjQxLjQxIDAgMDEwIC4xMSAxLjc1IDEuNzUgMCAwMS0uNTEgMS4yNCAxMy42OSAxMy42OSAwIDAwMy40Mi4yNEE4LjIxIDguMjEgMCAwMDE2IDEzLjgxYTExLjUgMTEuNSAwIDAxLTEuMzQuMDd6IiBmaWxsPSIjZjJmMmYyIiBvcGFjaXR5PSIuNTUiLz48Y2lyY2xlIGN4PSIxMC4xMyIgY3k9IjEzLjY3IiByPSIxLjc4IiBmaWxsPSJ1cmwoI2MpIi8+PHBhdGggZD0iTTEyLjMyIDguOTNhMS44MyAxLjgzIDAgMDEuNjEtMSAyNS41IDI1LjUgMCAwMS00LjQ2LTQuMTQgMTYuOTEgMTYuOTEgMCAwMS0yLTIuOTIgNy42NCA3LjY0IDAgMDAtMS4wOS40MiAxOC4xNCAxOC4xNCAwIDAwMi4xNSAzLjE4IDI2LjQ0IDI2LjQ0IDAgMDA0Ljc5IDQuNDZ6IiBmaWxsPSIjZjJmMmYyIiBvcGFjaXR5PSIuNyIvPjxjaXJjbGUgY3g9IjE0LjE4IiBjeT0iOS4yNyIgcj0iMS44OSIgZmlsbD0idXJsKCNkKSIvPjxwYXRoIGQ9Ik0xNy4zNSAxMC41NGwtLjM1LS4xNy0uMy0uMTZoLS4wNmwtLjI2LS4yMWgtLjA3TDE2IDkuOGExLjc2IDEuNzYgMCAwMS0uNjQuOTJjLjEyLjA4LjI1LjE1LjM4LjIybC4wOC4wNS4zNS4xOS44Ni40NWE4LjYzIDguNjMgMCAwMC4yOS0xLjExeiIgZmlsbD0iI2YyZjJmMiIgb3BhY2l0eT0iLjU1Ii8+PGNpcmNsZSBjeD0iNC4zOCIgY3k9IjguNjgiIHI9IjIuNzMiIGZpbGw9InVybCgjYikiLz48Y2lyY2xlIGN4PSIxMC4xMyIgY3k9IjEzLjY3IiByPSIxLjc4IiBmaWxsPSJ1cmwoI2MpIi8+PC9zdmc+',
      //     },
      //     {
      //       description:
      //         'When registered with the Azure Bot Service, you can host your bot in any environment and enable customers from a variety of channels, such as your app or website, Direct Line Speech, Microsoft Teams and more.',
      //       text: 'Microsoft Bot Channels Registration',
      //       tier: 'F0',
      //       group: 'Azure Hosting',
      //       key: 'botRegistration',
      //       required: true,
      //       name: 'seehowprovision',
      //       icon:
      //         'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iNTUuNzEiIGN5PSI3MS45MiIgcj0iOSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguOTQgMCAwIC45NCAtNDMuNjEgLTU4LjkyKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjY3IiBzdG9wLWNvbG9yPSIjNmJiOWYyIi8+PHN0b3Agb2Zmc2V0PSIuNzQiIHN0b3AtY29sb3I9IiM2MWI0ZjEiLz48c3RvcCBvZmZzZXQ9Ii44NSIgc3RvcC1jb2xvcj0iIzQ3YThlZiIvPjxzdG9wIG9mZnNldD0iLjk5IiBzdG9wLWNvbG9yPSIjMWQ5NGViIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMWI5M2ViIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTkgLjVBOC41IDguNSAwIDEwMTcuNSA5IDguNSA4LjUgMCAwMDkgLjV6IiBmaWxsPSJ1cmwoI2EpIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjcuMDMiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI3LjQ1IiBjeT0iOSIgcj0iLjc3IiBmaWxsPSIjMzJiZWRkIi8+PHBhdGggZD0iTTUuMjYgNi44aC0uMzhhLjI5LjI5IDAgMDAtLjI5LjI5djUuNzJhLjU5LjU5IDAgMDAuNTkuNTloNS41N2EuMjkuMjkgMCAwMC4yOS0uM3YtLjM4YS4yOS4yOSAwIDAwLS4yOS0uMjloLTVhLjE0LjE0IDAgMDEtLjE0LS4xNVY3LjA5YS4yOS4yOSAwIDAwLS4zNS0uMjl6IiBmaWxsPSIjMzJiZWRkIi8+PGNpcmNsZSBjeD0iMTAuNTUiIGN5PSI5IiByPSIuNzciIGZpbGw9IiMzMmJlZGQiLz48cGF0aCBkPSJNMTIuNDIgNC42SDcuMjNhLjI5LjI5IDAgMDAtLjI5LjN2LjM4YS4yOS4yOSAwIDAwLjI5LjI5aDVhLjE1LjE1IDAgMDEuMTUuMTV2NS4xOWEuMjkuMjkgMCAwMC4yOS4yOWguMzhhLjI5LjI5IDAgMDAuMjktLjI5VjUuMTlhLjU5LjU5IDAgMDAtLjU4LS41OXoiIGZpbGw9IiMzMmJlZGQiLz48L3N2Zz4=',
      //     },
      //   ],
      // };
      const fullConfig = {
        ...config,
        name: props.dialogId,
        type: 'azurePublish',
        appId: 'a4d9614f-8d63-456b-9854-ee81b135629a',
        appSecret: '09b2c045-8f77-46a9-bcf7-2abaaa80fa48',
      };

      let arm, graph;
      // if (!userShouldProvideTokens()) {
      //   let tenantId = myconfig.tenantId;

      //   if (!tenantId) {
      //     // eslint-disable-next-line no-console
      //     console.log('Provision config does not include tenant id, using tenant id from cache.');
      //     tenantId = getTenantIdFromCache();
      //   }

      //   // require tenant id to be set by plugin (handles multiple tenant scenario)
      //   if (!tenantId) {
      //     return;
      //   }

      //   // login or get token implicit
      //   arm = await AuthClient.getARMTokenForTenant(tenantId);
      //   graph = await AuthClient.getAccessToken(graphScopes);
      // } else {
      //   // get token from cache
      arm = getTokenFromCache('accessToken');
      graph = getTokenFromCache('graphToken');
      // }

      await provisionToTarget(fullConfig, config.type, projectId, arm, graph, undefined).then(() => {
        // console.log(botPropertyData[projectId].publishTargets[0])
        let { botPropertyData, botList } = generateBotPropertyData(botProjectData);
        console.log(generateBotPropertyData(botProjectData));
        const setting = botPropertyData[projectId].setting;
        const sensitiveSettings = getSensitiveProperties(setting);
        const token = getTokenFromCache('accessToken');
        publishToTarget(
          projectId,
          botPropertyData[projectId].publishTargets[botPropertyData[projectId].publishTargets.length - 1],
          { comment: '' },
          sensitiveSettings,
          token
        );
      });
    };
  }, [provision]);

  // props.dialogId is name
  // const publish = () => {
  //   let { info } = JSON.parse(recievedMessage);
  //   let config = JSON.parse(info.publishTarget.configuration);
  //       await fetch(`/api/publish/${projectId}/publish/${config.name}`, {
  //         method: 'POST', // or 'PUT',
  //         body: JSON.stringify(info),
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       })
  //         .then((response) => response.json())
  //         .then((result) => {
  //           setJobId(result.id);
  //           console.log('Finished publishing', result);
  //         });
  // };

  const activeBot = skillId ?? projectId;

  return (
    <div css={contentWrapper} role="main">
      <Split
        resetOnDoubleClick
        initialPrimarySize="20%"
        minPrimarySize="200px"
        minSecondarySize="800px"
        renderSplitter={renderThinSplitter}
        splitterSize="5px"
        onMeasuredSizesChanged={onMeasuredSizesChanged}
      >
        <div css={contentWrapper}>
          <div css={splitPaneContainer}>
            <div css={splitPaneWrapper}>
              <SideBar projectId={activeBot} />
            </div>
          </div>
        </div>

        <div css={contentWrapper} role="main">
          <CommandBar projectId={activeBot} />
          <Conversation css={splitPaneContainer}>
            <div css={splitPaneWrapper}>
              <Split
                resetOnDoubleClick
                initialPrimarySize="65%"
                minPrimarySize="500px"
                minSecondarySize="350px"
                renderSplitter={renderThinSplitter}
              >
                <VisualPanel projectId={activeBot} />
                <PropertyPanel isSkill={activeBot !== projectId} projectId={activeBot} />
              </Split>
            </div>
          </Conversation>
        </div>
      </Split>
      <Modals projectId={activeBot} />
      <button
        onClick={() => {
          setProvision(true);
          let myconfig = {
            hostname: 'seehowprovision',
            location: 'eastus2',
            luisLocation: 'westus',
            name: 'testbot',
            resourceGroup: 't-yujinchorg',
            subscription: '23f5367c-d006-4464-8de1-57141d52e809',
            tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
            type: 'azurePublish',
            externalResources: [
              {
                description: 'Required registration allowing your bot to communicate with Azure services.',
                text: 'Microsoft Application Registration',
                tier: 'Free',
                group: 'Azure Hosting',
                key: 'appRegistration',
                required: true,
                name: 'seehowprovision',
                icon:
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iLTY1MTguNzgiIHkxPSIxMTE4Ljg2IiB4Mj0iLTY1MTguNzgiIHkyPSIxMDkwLjA2IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC41IDAgMCAtLjUgMzI2Ny40MiA1NTkuOTkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNWVhMGVmIi8+PHN0b3Agb2Zmc2V0PSIuMTgiIHN0b3AtY29sb3I9IiM1ODllZWQiLz48c3RvcCBvZmZzZXQ9Ii40MSIgc3RvcC1jb2xvcj0iIzQ4OTdlOSIvPjxzdG9wIG9mZnNldD0iLjY2IiBzdG9wLWNvbG9yPSIjMmU4Y2UxIi8+PHN0b3Agb2Zmc2V0PSIuOTQiIHN0b3AtY29sb3I9IiMwYTdjZDciLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDc4ZDQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBkPSJNNS42NyAxMC42MUgxMHY0LjMySDUuNjd6bS01LTUuNzZINVYuNTNIMS4yM2EuNi42IDAgMDAtLjYuNnptLjYgMTAuMDhINXYtNC4zMkguNjN2My43MmEuNi42IDAgMDAuNi42em0tLjYtNUg1VjUuNTdILjYzem0xMC4wOCA1aDMuNzJhLjYuNiAwIDAwLjYtLjZ2LTMuNzJoLTQuMzZ6bS01LTVIMTBWNS41N0g1LjY3em01IDBIMTVWNS41N2gtNC4yOXptMC05LjM2djQuMjhIMTVWMS4xM2EuNi42IDAgMDAtLjYtLjZ6bS01IDQuMzJIMTBWLjUzSDUuNjd6IiBmaWxsPSJ1cmwoI2EpIi8+PHBhdGggZmlsbD0iIzMyYmVkZCIgZD0iTTE3LjM3IDEwLjd2NC41MWwtMy44NyAyLjI2di00LjUxbDMuODctMi4yNnoiLz48cGF0aCBmaWxsPSIjOWNlYmZmIiBkPSJNMTcuMzcgMTAuN2wtMy44NyAyLjI3LTMuODctMi4yNyAzLjg3LTIuMjYgMy44NyAyLjI2eiIvPjxwYXRoIGZpbGw9IiM1MGU2ZmYiIGQ9Ik0xMy41IDEyLjk3djQuNWwtMy44Ny0yLjI2VjEwLjdsMy44NyAyLjI3eiIvPjxwYXRoIGZpbGw9IiM5Y2ViZmYiIGQ9Ik05LjYzIDE1LjIxbDMuODctMi4yNXY0LjUxbC0zLjg3LTIuMjZ6Ii8+PHBhdGggZmlsbD0iIzUwZTZmZiIgZD0iTTE3LjM3IDE1LjIxbC0zLjg3LTIuMjV2NC41MWwzLjg3LTIuMjZ6Ii8+PC9zdmc+',
              },
              {
                description:
                  'App Service Web Apps lets you quickly build, deploy, and scale enterprise-grade web, mobile, and API apps running on any platform. Hosting for your bot.',
                text: 'Azure Hosting',
                tier: 'S1 Standard',
                group: 'Azure Hosting',
                key: 'webApp',
                required: true,
                name: 'seehowprovision',
                icon:
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iNC40IiB5MT0iMTEuNDgiIHgyPSI0LjM3IiB5Mj0iNy41MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjIiB4MT0iMTAuMTMiIHkxPSIxNS40NSIgeDI9IjEwLjEzIiB5Mj0iMTEuOSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJkIiB4MT0iMTQuMTgiIHkxPSIxMS4xNSIgeDI9IjE0LjE4IiB5Mj0iNy4zOCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2NjYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZjZmNmYyIvPjwvbGluZWFyR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iMTM0MjguODEiIGN5PSIzNTE4Ljg2IiByPSI1Ni42NyIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguMTUgMCAwIC4xNSAtMjAwNS4zMyAtNTE4LjgzKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjE4IiBzdG9wLWNvbG9yPSIjNWVhMGVmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDA3OGQ0Ii8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTE0LjIxIDE1LjcyQTguNSA4LjUgMCAwMTMuNzkgMi4yOGwuMDktLjA2YTguNSA4LjUgMCAwMTEwLjMzIDEzLjUiIGZpbGw9InVybCgjYSkiLz48cGF0aCBkPSJNNi42OSA3LjIzYTEzIDEzIDAgMDE4LjkxLTMuNTggOC40NyA4LjQ3IDAgMDAtMS40OS0xLjQ0IDE0LjM0IDE0LjM0IDAgMDAtNC42OSAxLjEgMTIuNTQgMTIuNTQgMCAwMC00LjA4IDIuODIgMi43NiAyLjc2IDAgMDExLjM1IDEuMXpNMi40OCAxMC42NWExNy44NiAxNy44NiAwIDAwLS44MyAyLjYyIDcuODIgNy44MiAwIDAwLjYyLjkyYy4xOC4yMy4zNS40NC41NS42NWExNy45NCAxNy45NCAwIDAxMS4wOC0zLjQ3IDIuNzYgMi43NiAwIDAxLTEuNDItLjcyeiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjYiLz48cGF0aCBkPSJNMy40NiA2LjExYTEyIDEyIDAgMDEtLjY5LTIuOTQgOC4xNSA4LjE1IDAgMDAtMS4xIDEuNDVBMTIuNjkgMTIuNjkgMCAwMDIuMjQgN2EyLjY5IDIuNjkgMCAwMTEuMjItLjg5eiIgZmlsbD0iI2YyZjJmMiIgb3BhY2l0eT0iLjU1Ii8+PGNpcmNsZSBjeD0iNC4zOCIgY3k9IjguNjgiIHI9IjIuNzMiIGZpbGw9InVybCgjYikiLz48cGF0aCBkPSJNOC4zNiAxMy42N2ExLjc3IDEuNzcgMCAwMS41NC0xLjI3IDExLjg4IDExLjg4IDAgMDEtMi41My0xLjg2IDIuNzQgMi43NCAwIDAxLTEuNDkuODMgMTMuMSAxMy4xIDAgMDAxLjQ1IDEuMjggMTIuMTIgMTIuMTIgMCAwMDIuMDUgMS4yNSAxLjc5IDEuNzkgMCAwMS0uMDItLjIzek0xNC42NiAxMy44OGExMiAxMiAwIDAxLTIuNzYtLjMyLjQxLjQxIDAgMDEwIC4xMSAxLjc1IDEuNzUgMCAwMS0uNTEgMS4yNCAxMy42OSAxMy42OSAwIDAwMy40Mi4yNEE4LjIxIDguMjEgMCAwMDE2IDEzLjgxYTExLjUgMTEuNSAwIDAxLTEuMzQuMDd6IiBmaWxsPSIjZjJmMmYyIiBvcGFjaXR5PSIuNTUiLz48Y2lyY2xlIGN4PSIxMC4xMyIgY3k9IjEzLjY3IiByPSIxLjc4IiBmaWxsPSJ1cmwoI2MpIi8+PHBhdGggZD0iTTEyLjMyIDguOTNhMS44MyAxLjgzIDAgMDEuNjEtMSAyNS41IDI1LjUgMCAwMS00LjQ2LTQuMTQgMTYuOTEgMTYuOTEgMCAwMS0yLTIuOTIgNy42NCA3LjY0IDAgMDAtMS4wOS40MiAxOC4xNCAxOC4xNCAwIDAwMi4xNSAzLjE4IDI2LjQ0IDI2LjQ0IDAgMDA0Ljc5IDQuNDZ6IiBmaWxsPSIjZjJmMmYyIiBvcGFjaXR5PSIuNyIvPjxjaXJjbGUgY3g9IjE0LjE4IiBjeT0iOS4yNyIgcj0iMS44OSIgZmlsbD0idXJsKCNkKSIvPjxwYXRoIGQ9Ik0xNy4zNSAxMC41NGwtLjM1LS4xNy0uMy0uMTZoLS4wNmwtLjI2LS4yMWgtLjA3TDE2IDkuOGExLjc2IDEuNzYgMCAwMS0uNjQuOTJjLjEyLjA4LjI1LjE1LjM4LjIybC4wOC4wNS4zNS4xOS44Ni40NWE4LjYzIDguNjMgMCAwMC4yOS0xLjExeiIgZmlsbD0iI2YyZjJmMiIgb3BhY2l0eT0iLjU1Ii8+PGNpcmNsZSBjeD0iNC4zOCIgY3k9IjguNjgiIHI9IjIuNzMiIGZpbGw9InVybCgjYikiLz48Y2lyY2xlIGN4PSIxMC4xMyIgY3k9IjEzLjY3IiByPSIxLjc4IiBmaWxsPSJ1cmwoI2MpIi8+PC9zdmc+',
              },
              {
                description:
                  'When registered with the Azure Bot Service, you can host your bot in any environment and enable customers from a variety of channels, such as your app or website, Direct Line Speech, Microsoft Teams and more.',
                text: 'Microsoft Bot Channels Registration',
                tier: 'F0',
                group: 'Azure Hosting',
                key: 'botRegistration',
                required: true,
                name: 'seehowprovision',
                icon:
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOCAxOCI+PGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iNTUuNzEiIGN5PSI3MS45MiIgcj0iOSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguOTQgMCAwIC45NCAtNDMuNjEgLTU4LjkyKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjY3IiBzdG9wLWNvbG9yPSIjNmJiOWYyIi8+PHN0b3Agb2Zmc2V0PSIuNzQiIHN0b3AtY29sb3I9IiM2MWI0ZjEiLz48c3RvcCBvZmZzZXQ9Ii44NSIgc3RvcC1jb2xvcj0iIzQ3YThlZiIvPjxzdG9wIG9mZnNldD0iLjk5IiBzdG9wLWNvbG9yPSIjMWQ5NGViIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMWI5M2ViIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTkgLjVBOC41IDguNSAwIDEwMTcuNSA5IDguNSA4LjUgMCAwMDkgLjV6IiBmaWxsPSJ1cmwoI2EpIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjcuMDMiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI3LjQ1IiBjeT0iOSIgcj0iLjc3IiBmaWxsPSIjMzJiZWRkIi8+PHBhdGggZD0iTTUuMjYgNi44aC0uMzhhLjI5LjI5IDAgMDAtLjI5LjI5djUuNzJhLjU5LjU5IDAgMDAuNTkuNTloNS41N2EuMjkuMjkgMCAwMC4yOS0uM3YtLjM4YS4yOS4yOSAwIDAwLS4yOS0uMjloLTVhLjE0LjE0IDAgMDEtLjE0LS4xNVY3LjA5YS4yOS4yOSAwIDAwLS4zNS0uMjl6IiBmaWxsPSIjMzJiZWRkIi8+PGNpcmNsZSBjeD0iMTAuNTUiIGN5PSI5IiByPSIuNzciIGZpbGw9IiMzMmJlZGQiLz48cGF0aCBkPSJNMTIuNDIgNC42SDcuMjNhLjI5LjI5IDAgMDAtLjI5LjN2LjM4YS4yOS4yOSAwIDAwLjI5LjI5aDVhLjE1LjE1IDAgMDEuMTUuMTV2NS4xOWEuMjkuMjkgMCAwMC4yOS4yOWguMzhhLjI5LjI5IDAgMDAuMjktLjI5VjUuMTlhLjU5LjU5IDAgMDAtLjU4LS41OXoiIGZpbGw9IiMzMmJlZGQiLz48L3N2Zz4=',
              },
            ],
          };
          window.postMessage({ type: 'provisionInfo', publishInfo: myconfig }, '*');
        }}
      >
        Publish
      </button>
      <div style={{ display: 'none' }}>
        <Fragment>
          <div css={azurePublishSurface}>
            <PluginHost bundleId="azurePublish" pluginName="azurePublish" pluginType="publish" projectId={projectId} />
          </div>
        </Fragment>
      </div>
    </div>
  );
};

export default DesignPage;
