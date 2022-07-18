import { CommandBar, ICommandBarItemProps, IContextualMenuItem, Sticky, StickyPositionType } from '@fluentui/react';
import { Avatar } from '@fluentui/react-components';
import React, { useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../../providers/UserProvider";

export const AppHeader: React.FunctionComponent<any> = (props) => {

    const userContext = useContext(UserContext);
    let navigate = useNavigate();

    function onNewClick (ev?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement> | undefined, item?:IContextualMenuItem | undefined) 
    {
      navigate("new");
    }

    function onHomeClick (ev?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement> | undefined, item?:IContextualMenuItem | undefined) 
    {
      navigate("");
    }

    const _items: ICommandBarItemProps[] = [
        {
            key: "title",
            text: process.env.REACT_APP_TEST_SYS === 'true' ? 'In-Out-Process TEST' : 'In-Out-Process',
            onClick: onHomeClick,
        },
        {
          key: 'newItem',
          text: 'New',
          iconPros: {iconName: 'Add'},
          onClick: onNewClick,
        }
        ];

    const _farItems: ICommandBarItemProps[] =[
            {
              onRenderMenuIcon: () => null,
              onRenderChildren: () => <Avatar image={{src: userContext.user?.imageUrl}} name={userContext.user?.Title} size={32}  />,
              key: 'persona',
              name: userContext.user?.Title,
              iconOnly: true
            }
        ]          



    return (
        <Sticky stickyPosition={StickyPositionType.Header}>
        <div role="heading" aria-level={1}>
            <CommandBar items={_items} farItems={_farItems} ></CommandBar>
        </div>
      </Sticky>        

    );
}
