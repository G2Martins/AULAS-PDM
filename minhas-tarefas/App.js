import { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MetaInput from './components/MetaInput';
import MetasList from './components/MetasList';

export default function App() {
  const [metas, setMetas] = useState([]);

  function adicionarMetaHandler(inputMeta) {
    if (inputMeta.trim() === '') return;
    
    // Agora salvamos um objeto com um ID único e o texto
    setMetas(metasAtuais => [
      ...metasAtuais, 
      { id: Math.random().toString(), text: inputMeta }
    ]);
  }

  function removerMetaHandler(metaId) {
    // Filtra o array mantendo apenas os itens com ID diferente do clicado
    setMetas(metasAtuais => metasAtuais.filter(meta => meta.id !== metaId));
  }

  function editarMetaHandler(metaId, novoTexto) {
    // Mapeia o array e atualiza apenas o texto do item correspondente
    setMetas(metasAtuais => 
      metasAtuais.map(meta => 
        meta.id === metaId ? { ...meta, text: novoTexto } : meta
      )
    );
  }

  return (
    <View style={styles.mainContainer}>
      
      {/* Menu-bar (Header) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Tarefas</Text>
      </View>

      <MetaInput onAddMeta={adicionarMetaHandler} />

      <View style={styles.metaContainer}>
        <MetasList 
          array={metas} 
          onDelete={removerMetaHandler}
          onEdit={editarMetaHandler}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    padding: 30,
    paddingTop: 50,
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#5e0acc',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center', // Centraliza o texto
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  metaContainer: {
    flex: 1,
    marginTop: 20,
  },
});