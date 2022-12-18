import { GraphQLResult } from "@aws-amplify/api-graphql";
import { API } from "aws-amplify";
import { ChangeEvent, useEffect, useReducer } from "react";
import { listTodos } from "./graphql/queries";
import "antd/dist/reset.css";
import { Button, Input, List } from "antd";
import { v4 as uuid } from "uuid";
import { createTodo as CreateTodo } from "./graphql/mutations";

const CLIENT_ID = uuid();

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
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "RESET_FORM":
      return { ...state, form: initalState.form };
    case "SET_INPUT":
      return { ...state, form: { ...state.form, [action.name]: action.value } };
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

  const createNote = async () => {
    const { form } = state;
    if (!form.name || !form.description) {
      return alert("please enter a name and description");
    }
    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() };
    dispatch({ type: "ADD_NOTE", note });
    dispatch({ type: "RESET_FORM" });
    try {
      await API.graphql({
        query: CreateTodo,
        variables: { input: note },
      });
      console.log("successfully create note!");
    } catch (err) {
      console.log("error:", err);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_INPUT", name: e.target.name, value: e.target.value });
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
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Note Name"
        name="name"
        style={{ marginBottom: "10px" }}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Note description"
        name="description"
        style={{ marginBottom: "10px" }}
      />
      <Button onClick={createNote} type="primary">
        Create Note
      </Button>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
