import { Button } from "@fluentui/react-components";
import { FunctionComponent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IItem, ItemApiConfig } from "./api/ItemApi";
import { CheckList } from "./components/CheckList/CheckList";
import { useChecklistItems } from "./api/CheckListItemApi";

export const Item: FunctionComponent = (props) => {
  const { itemNum } = useParams();
  const itemApi = ItemApiConfig.getApi();
  const [item, setItem] = useState<IItem>({ Id: 0, Title: "" });
  const checklisItems = useChecklistItems(Number(itemNum));

  async function updateItem() {
    let updatedItem = { ...item, Title: "TEST" };
    let res = await itemApi.updateItem(updatedItem);
    return res;
  }

  useEffect(() => {
    const loadItem = async () => {
      const res = await itemApi.getItemById(Number(itemNum));
      if (res) {
        setItem(res);
      }
    };

    loadItem();
  }, [itemNum]);

  return (
    <div>
      <h1>Welcome to the Item Page</h1>

      <p>Getting info for {itemNum}</p>
      <p>Response: {item.Title}</p>

      <CheckList CheckListItems={checklisItems} />

      <Button appearance="primary" onClick={updateItem}>
        Update
      </Button>
    </div>
  );
};
