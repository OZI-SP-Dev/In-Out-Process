import { Button } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ICheckListItem } from "./api/CheckListItemApi";
import { IItem, ItemApiConfig } from "./api/ItemApi";
import { CheckList } from "./components/CheckList/CheckList";
import { CheckListItemApiConfig } from "./api/CheckListItemApi";

export const Item: React.FunctionComponent = (props) => {
  const { itemNum } = useParams();
  const itemApi = ItemApiConfig.getApi();
  const checklistItemApi = CheckListItemApiConfig.getApi();
  const [item, setItem] = useState<IItem>({ Id: 0, Title: "" });
  const [checklisItems, setChecklistItems] = useState<ICheckListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function updateItem() {
    let updatedItem = { ...item, Title: "TEST" };
    let res = await itemApi.updateItem(updatedItem);
    return res;
  }

  useEffect(() => {
    async function loadItem() {
      let res = await itemApi.getItemById(Number(itemNum));
      if (res) {
        setItem(res);
      }
    }

    async function fetchChecklistItems() {
      let items = await checklistItemApi.getItemsById(Number(itemNum));
      if (items) {
        setChecklistItems(items);
        setLoading(false);
      }
    }

    loadItem();
    fetchChecklistItems();
  }, [itemNum]);

  return (
    <div>
      <h1>Welcome to the Item Page</h1>

      <p>Getting info for {itemNum}</p>
      <p>Response: {item.Title}</p>

      <CheckList CheckListItems={checklisItems} loading={loading} />

      <Button appearance="primary" onClick={updateItem}>
        Update
      </Button>
    </div>
  );
};
