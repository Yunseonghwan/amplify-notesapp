import { GraphQLResult } from "@aws-amplify/api-graphql";
import { API } from "aws-amplify";
import { useEffect, useReducer } from "react";
import { listTodos } from "./graphql/queries";
import "antd/dist/reset.css";
import { List } from "antd";

interface IState {
  notes: [];
  loading: boolean;
  error: boolean;
  form: { name: string; description: string };
}

const initalState: IState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: "", description: "" },
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.notes, loading: false };
    case "ERROR":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initalState);

  const fetchNotes = async () => {
    try {
      const notesData: GraphQLResult<any> = await API.graphql({
        query: listTodos,
      });
      dispatch({ type: "SET_NOTES", notes: notesData.data.listTodos.items });
    } catch (err) {
      dispatch({ type: "ERROR" });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const renderItem = (item: any) => {
    return (
      <List.Item style={{ textAlign: "left" }}>
        <List.Item.Meta title={item.name} description={item.description} />
      </List.Item>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
