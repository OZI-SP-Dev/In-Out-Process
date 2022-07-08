import { CommandBar, ICommandBarItemProps, PersonaCoin, PersonaSize, Sticky, StickyPositionType } from '@fluentui/react';
import React, { useContext } from "react";
import { UserContext } from "../../providers/UserProvider";

export const AppHeader: React.FunctionComponent<any> = (props) => {

    const userContext = useContext(UserContext);

    const _items: ICommandBarItemProps[] = [
        {
            key: "title",
            text: 'In-Out-Process'
        },
        {
          key: 'newItem',
          text: 'New',
          iconPros: {iconName: 'Add'}
        }
        ];

    /* const _farItems: ICommandBarItemProps[] = [
        {
            key: "loginID",
            text: userContext.user?.Title
        }
        ];
*/
    const _farItems: ICommandBarItemProps[] =[
            {
              onRenderMenuIcon: () => null,
              onRenderChildren: () => <PersonaCoin imageUrl= {userContext.user?.imageUrl} text={userContext.user?.Title} size={PersonaSize.size32} />,
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