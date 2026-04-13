import { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text } from 'react-native';
import { rotulo_btn_cadastro_meta, rotulo_input_meta } from '../mensagens';

export default function MetaInput(props) {
  const [inputMetaText, setInputMetaText] = useState('');

  function metaInputHandler(enteredText) {
    setInputMetaText(enteredText);
  }

  function addMetaHandler() {
    props.onAddMeta(inputMetaText);
    setInputMetaText('');
  }

  return (
    <View style={styles.inputRow}>
      <View style={{ width: '65%' }}>
        <TextInput
          style={styles.inputText}
          placeholder={rotulo_input_meta || "Digite a sua meta"}
          onChangeText={metaInputHandler}
          value={inputMetaText}
        />
      </View>
      <View style={{ width: '30%' }}>
        {/* Usamos TouchableOpacity para controlar 100% o estilo do botão */}
        <TouchableOpacity style={styles.button} onPress={addMetaHandler}>
          <Text style={styles.buttonText}>{rotulo_btn_cadastro_meta || "ADICIONAR"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    borderColor: '#cccccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#5e0acc',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});