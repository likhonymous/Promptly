'use client';

import React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronsRight, ChevronsLeft, FileText, Monitor, Terminal as TerminalIcon } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import { useEditor } from '../context/EditorContext';

const Editor = () => {
    const {
        isSidebarOpen, setIsSidebarOpen,
        isLoading,
        fileTree,
        activeFile, setActiveFile,
        fileContent, handleEditorChange,
        isInstalling, installDependencies,
        isServerRunning, runServer,
        previewUrl,
        terminalRef
    } = useEditor();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading WebContainer...</p></div>;
    }

    return (
        <div className="flex h-[80vh] w-full max-w-7xl border rounded-lg overflow-hidden bg-slate-800">
            <Collapsible.Root open={isSidebarOpen} onOpenChange={setIsSidebarOpen} className="h-full bg-slate-900 data-[state=open]:w-64 data-[state=closed]:w-12 transition-all duration-300 ease-in-out">
                <Collapsible.Trigger asChild><button className="p-3 text-white">{isSidebarOpen ? <ChevronsLeft /> : <ChevronsRight />}</button></Collapsible.Trigger>
                <Collapsible.Content>
                    <div className="p-4 text-white">
                        <h2 className="text-lg font-semibold mb-4">Files</h2>
                        {fileTree.map((file) => (
                            <div key={file.name} className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${activeFile === file.name ? 'bg-slate-700' : 'hover:bg-slate-800'}`} onClick={() => setActiveFile(file.name)}>
                                <FileText size={16} /><span>{file.name}</span>
                            </div>
                        ))}
                    </div>
                </Collapsible.Content>
            </Collapsible.Root>
            <div className="flex-1 h-full">
                <Tabs.Root defaultValue="editor" className="h-full flex flex-col">
                    <Tabs.List className="flex border-b bg-slate-900">
                        <Tabs.Trigger value="editor" className="p-3 text-white data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 border-blue-500 flex items-center space-x-2"><FileText size={16} /><span>Editor</span></Tabs.Trigger>
                        <Tabs.Trigger value="preview" className="p-3 text-white data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 border-blue-500 flex items-center space-x-2"><Monitor size={16} /><span>Preview</span></Tabs.Trigger>
                        <Tabs.Trigger value="console" className="p-3 text-white data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 border-blue-500 flex items-center space-x-2"><TerminalIcon size={16} /><span>Console</span></Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="editor" className="flex-1 bg-[#1e1e1e]">
                        <MonacoEditor height="100%" path={activeFile} value={fileContent} onChange={handleEditorChange} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 16, wordWrap: 'on' }} />
                    </Tabs.Content>
                    <Tabs.Content value="preview" className="flex-1 bg-white">
                        {previewUrl ? (
                            <iframe src={previewUrl} className="w-full h-full border-0" title="Live Preview" />
                        ) : (
                            <div className="flex justify-center items-center h-full"><p className="text-gray-500">Run the server to see a preview.</p></div>
                        )}
                    </Tabs.Content>
                    <Tabs.Content value="console" className="flex-1 flex flex-col bg-black">
                        <div className="p-2 bg-slate-800 flex items-center space-x-2">
                            <button onClick={installDependencies} disabled={isInstalling} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:bg-gray-500">{isInstalling ? 'Installing...' : 'Install Dependencies'}</button>
                            <button onClick={runServer} disabled={isServerRunning || isInstalling} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded disabled:bg-gray-500">{isServerRunning ? 'Server Running' : 'Run Server'}</button>
                        </div>
                        <div ref={terminalRef} className="h-full w-full" />
                    </Tabs.Content>
                </Tabs.Root>
            </div>
        </div>
    );
};

export default Editor;
